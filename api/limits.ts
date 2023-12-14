// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

import { HubPool__factory } from "@across-protocol/contracts-v2/dist/typechain";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import {
  BLOCK_TAG_LAG,
  DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
  disabledL1Tokens,
  TOKEN_SYMBOLS_MAP,
} from "./_constants";
import { TypedVercelRequest } from "./_types";
import { object, assert, Infer, optional } from "superstruct";

import {
  getLogger,
  InputError,
  getRelayerFeeDetails,
  getCachedTokenPrice,
  getTokenDetails,
  maxBN,
  minBN,
  isRouteEnabled,
  handleErrorCondition,
  validAddress,
  positiveIntStr,
  getLpCushion,
  getProvider,
  HUB_POOL_CHAIN_ID,
  ENABLED_ROUTES,
  getBalance,
  getDefaultRelayerAddress,
  sendResponse,
} from "./_utils";

const LimitsQueryParamsSchema = object({
  token: validAddress(),
  destinationChainId: positiveIntStr(),
  originChainId: optional(positiveIntStr()),
});

type LimitsQueryParams = Infer<typeof LimitsQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<LimitsQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Limits",
    message: "Query data",
    query,
  });
  try {
    const {
      REACT_APP_FULL_RELAYERS, // These are relayers running a full auto-rebalancing strategy.
      REACT_APP_TRANSFER_RESTRICTED_RELAYERS, // These are relayers whose funds stay put.
      REACT_APP_MIN_DEPOSIT_USD,
    } = process.env;
    const provider = getProvider(HUB_POOL_CHAIN_ID);
    logger.debug({
      at: "limits",
      message: `Using INFURA provider for chain ${HUB_POOL_CHAIN_ID}`,
    });

    const minDeposits = REACT_APP_MIN_DEPOSIT_USD
      ? JSON.parse(REACT_APP_MIN_DEPOSIT_USD)
      : {};

    const fullRelayers = !REACT_APP_FULL_RELAYERS
      ? []
      : (JSON.parse(REACT_APP_FULL_RELAYERS) as string[]).map((relayer) => {
          return ethers.utils.getAddress(relayer);
        });
    const transferRestrictedRelayers = !REACT_APP_TRANSFER_RESTRICTED_RELAYERS
      ? []
      : (JSON.parse(REACT_APP_TRANSFER_RESTRICTED_RELAYERS) as string[]).map(
          (relayer) => {
            return ethers.utils.getAddress(relayer);
          }
        );

    assert(query, LimitsQueryParamsSchema);

    let { token, destinationChainId, originChainId } = query;

    if (originChainId === destinationChainId) {
      throw new InputError("Origin and destination chains cannot be the same");
    }

    token = ethers.utils.getAddress(token);

    const { l1Token, chainId: computedOriginChainId } = await getTokenDetails(
      provider,
      undefined,
      token,
      originChainId
    );

    const tokenDetails = Object.values(TOKEN_SYMBOLS_MAP).find(
      (details) => details.addresses[HUB_POOL_CHAIN_ID] === l1Token
    );

    if (tokenDetails === undefined) {
      throw new InputError("Unsupported token address");
    }
    const symbol = tokenDetails.symbol;

    const [tokenDetailsResult, routeEnabledResult] = await Promise.allSettled([
      getTokenDetails(provider, l1Token, undefined, destinationChainId),
      isRouteEnabled(computedOriginChainId, Number(destinationChainId), token),
    ]);
    // If any of the above fails or the route is not enabled, we assume that the
    if (
      tokenDetailsResult.status === "rejected" ||
      routeEnabledResult.status === "rejected"
    ) {
      throw new InputError(`Unable to query route.`);
    } else if (
      !routeEnabledResult.value ||
      disabledL1Tokens.includes(l1Token.toLowerCase())
    ) {
      throw new InputError(`Route is not enabled.`);
    }

    const { l2Token: destinationToken } = tokenDetailsResult.value;
    const hubPool = HubPool__factory.connect(
      ENABLED_ROUTES.hubPoolAddress,
      provider
    );

    const multicallInput = [
      hubPool.interface.encodeFunctionData("sync", [l1Token]),
      hubPool.interface.encodeFunctionData("pooledTokens", [l1Token]),
    ];

    // @todo: Generalise the resolution of chainId => gasToken.
    const [tokenPriceNative, _tokenPriceUsd] = await Promise.all([
      getCachedTokenPrice(
        l1Token,
        destinationChainId === "137" ? "matic" : "eth"
      ),
      getCachedTokenPrice(l1Token, "usd"),
    ]);
    const tokenPriceUsd = ethers.utils.parseUnits(_tokenPriceUsd.toString());

    const [
      relayerFeeDetails,
      multicallOutput,
      fullRelayerBalances,
      transferRestrictedBalances,
      fullRelayerMainnetBalances,
    ] = await Promise.all([
      getRelayerFeeDetails(
        l1Token,
        ethers.BigNumber.from("10").pow(tokenDetails.decimals),
        computedOriginChainId,
        Number(destinationChainId),
        DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
        tokenPriceNative,
        undefined,
        getDefaultRelayerAddress(symbol, Number(destinationChainId))
      ),
      hubPool.callStatic.multicall(multicallInput, { blockTag: BLOCK_TAG_LAG }),
      Promise.all(
        fullRelayers.map((relayer) =>
          getBalance(destinationChainId!, destinationToken, relayer)
        )
      ),
      Promise.all(
        transferRestrictedRelayers.map((relayer) =>
          getBalance(destinationChainId!, destinationToken, relayer)
        )
      ),
      Promise.all(
        fullRelayers.map((relayer) =>
          destinationChainId === "1"
            ? ethers.BigNumber.from("0")
            : getBalance("1", l1Token, relayer)
        )
      ),
    ]);

    let { liquidReserves } = hubPool.interface.decodeFunctionResult(
      "pooledTokens",
      multicallOutput[1]
    );

    const lpCushion = ethers.utils.parseUnits(
      getLpCushion(symbol, computedOriginChainId, Number(destinationChainId)),
      tokenDetails.decimals
    );
    liquidReserves = liquidReserves.sub(lpCushion);
    if (liquidReserves.lt(0)) liquidReserves = ethers.BigNumber.from(0);

    const minDeposit = ethers.BigNumber.from(relayerFeeDetails.minDeposit);

    // Normalise the environment-set USD minimum to units of the token being bridged.
    const minDepositFloor = tokenPriceUsd.lte(0)
      ? ethers.BigNumber.from(0)
      : ethers.utils
          .parseUnits(
            (minDeposits[destinationChainId] ?? 0).toString(),
            tokenDetails.decimals
          )
          .mul(ethers.utils.parseUnits("1"))
          .div(tokenPriceUsd);

    const transferBalances = fullRelayerBalances.map((balance, i) =>
      balance.add(fullRelayerMainnetBalances[i])
    );

    const responseJson = {
      // Absolute minimum may be overridden by the environment.
      minDeposit: maxBN(minDeposit, minDepositFloor).toString(),
      maxDeposit: liquidReserves.toString(),
      // Note: max is used here rather than sum because relayers currently do not partial fill.
      maxDepositInstant: minBN(
        maxBN(...fullRelayerBalances, ...transferRestrictedBalances),
        liquidReserves
      ).toString(),
      // Same as above.
      maxDepositShortDelay: minBN(
        maxBN(...transferBalances, ...transferRestrictedBalances),
        liquidReserves
      ).toString(),
    };
    logger.debug({
      at: "Limits",
      message: "Response data",
      responseJson,
    });
    // Respond with a 200 status code and 4 minutes of cache cache with
    // a minute of stale-while-revalidate.
    sendResponse(response, responseJson, 200, 240, 60);
  } catch (error: unknown) {
    return handleErrorCondition("limits", response, logger, error);
  }
};

export default handler;
