// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

import { HubPool__factory } from "@across-protocol/contracts-v2";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { BLOCK_TAG_LAG, disabledL1Tokens } from "./_constants";
import { isPromiseRejectedResult } from "./_typeguards";
import { TypedVercelRequest } from "./_types";
import * as sdk from "@across-protocol/sdk-v2";
import { object, assert, Infer, optional } from "superstruct";

import {
  getLogger,
  InputError,
  getRelayerFeeDetails,
  getCachedTokenPrice,
  getTokenDetails,
  getBalance,
  maxBN,
  minBN,
  isRouteEnabled,
  handleErrorCondition,
  validAddress,
  positiveIntStr,
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
  try {
    const {
      REACT_APP_PUBLIC_INFURA_ID,
      REACT_APP_FULL_RELAYERS, // These are relayers running a full auto-rebalancing strategy.
      REACT_APP_TRANSFER_RESTRICTED_RELAYERS, // These are relayers whose funds stay put.
      REACT_APP_MIN_DEPOSIT_USD,
    } = process.env;
    const providerUrl = `https://mainnet.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`;
    const provider = new ethers.providers.StaticJsonRpcProvider(providerUrl);
    logger.debug({ at: "limits", message: `Using provider at ${providerUrl}` });

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

    const tokenDetails = Object.values(sdk.constants.TOKEN_SYMBOLS_MAP).find(
      (details) =>
        details.addresses[sdk.constants.CHAIN_IDs.MAINNET] === l1Token
    );
    if (tokenDetails === undefined)
      throw new InputError(`Unsupported token address: ${token}`);
    const symbol = tokenDetails.symbol;

    const [tokenDetailsResult, routeEnabledResult] = await Promise.allSettled([
      getTokenDetails(provider, l1Token, undefined, destinationChainId),
      isRouteEnabled(computedOriginChainId, Number(destinationChainId), token),
    ]);
    // If any of the above fails or the route is not enabled, we assume that the
    if (
      disabledL1Tokens.includes(l1Token.toLowerCase()) ||
      tokenDetailsResult.status === "rejected" ||
      routeEnabledResult.status === "rejected" ||
      !routeEnabledResult.value
    ) {
      // Add the raw error (if any) to ensure that the user sees the real error if it's something unexpected, like a provider issue.
      const rawError =
        (isPromiseRejectedResult(tokenDetailsResult) &&
          tokenDetailsResult.reason) ||
        (isPromiseRejectedResult(routeEnabledResult) && routeEnabledResult);

      const errorString = rawError
        ? `Raw Error: ${rawError.stack || rawError.toString()}`
        : "";
      throw new InputError(
        `Route from chainId ${computedOriginChainId} to chainId ${destinationChainId} with origin token address ${token} is not enabled. ${errorString}`
      );
    }

    const { l2Token: destinationToken } = tokenDetailsResult.value;
    const hubPool = HubPool__factory.connect(
      "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
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
        ethers.BigNumber.from("10").pow(18),
        Number(destinationChainId),
        tokenPriceNative
      ),
      hubPool.callStatic.multicall(multicallInput, { blockTag: BLOCK_TAG_LAG }),
      Promise.all(
        fullRelayers.map((relayer) =>
          getBalance(
            destinationChainId!,
            destinationToken,
            relayer,
            BLOCK_TAG_LAG
          )
        )
      ),
      Promise.all(
        transferRestrictedRelayers.map((relayer) =>
          getBalance(
            destinationChainId!,
            destinationToken,
            relayer,
            BLOCK_TAG_LAG
          )
        )
      ),
      Promise.all(
        fullRelayers.map((relayer) =>
          destinationChainId === "1"
            ? ethers.BigNumber.from("0")
            : getBalance("1", l1Token, relayer, BLOCK_TAG_LAG)
        )
      ),
    ]);

    let { liquidReserves } = hubPool.interface.decodeFunctionResult(
      "pooledTokens",
      multicallOutput[1]
    );

    const lpCushion = ethers.utils.parseUnits(
      process.env[`REACT_APP_${symbol}_LP_CUSHION`] ?? "0",
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

    // Instruct Vercel to cache limit data for this token for 5 minutes. Caching can be used to limit number of
    // Vercel invocations and run time for this serverless function and trades off potential inaccuracy in times of
    // high volume. "max-age=0" instructs browsers not to cache, while s-maxage instructs Vercel edge caching
    // to cache the responses and invalidate when deployments update.
    response.setHeader("Cache-Control", "s-maxage=300");
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("limits", response, logger, error);
  }
};

export default handler;
