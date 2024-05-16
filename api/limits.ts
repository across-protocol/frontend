import { utils as sdkUtils } from "@across-protocol/sdk-v2";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import {
  BLOCK_TAG_LAG,
  DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
} from "./_constants";
import { TypedVercelRequest } from "./_types";
import { object, assert, Infer, optional } from "superstruct";

import {
  getLogger,
  getRelayerFeeDetails,
  getCachedTokenPrice,
  getCachedTokenBalance,
  maxBN,
  minBN,
  handleErrorCondition,
  validAddress,
  positiveIntStr,
  getLpCushion,
  getProvider,
  HUB_POOL_CHAIN_ID,
  getDefaultRelayerAddress,
  sendResponse,
  getHubPool,
  validateChainAndTokenParams,
  getRecommendedDepositInstantLimit,
} from "./_utils";

const LimitsQueryParamsSchema = object({
  token: optional(validAddress()),
  inputToken: optional(validAddress()),
  outputToken: optional(validAddress()),
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

    const {
      destinationChainId,
      resolvedOriginChainId: computedOriginChainId,
      l1Token,
      inputToken,
      outputToken,
    } = validateChainAndTokenParams(query);

    const hubPool = getHubPool(provider);

    const multicallInput = [
      hubPool.interface.encodeFunctionData("sync", [l1Token.address]),
      hubPool.interface.encodeFunctionData("pooledTokens", [l1Token.address]),
    ];

    const [tokenPriceNative, _tokenPriceUsd] = await Promise.all([
      getCachedTokenPrice(
        l1Token.address,
        sdkUtils.getNativeTokenSymbol(destinationChainId).toLowerCase()
      ),
      getCachedTokenPrice(l1Token.address, "usd"),
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
        inputToken.address,
        outputToken.address,
        ethers.BigNumber.from("10").pow(l1Token.decimals),
        computedOriginChainId,
        destinationChainId,
        DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
        tokenPriceNative,
        undefined,
        getDefaultRelayerAddress(l1Token.symbol, destinationChainId)
      ),
      hubPool.callStatic.multicall(multicallInput, { blockTag: BLOCK_TAG_LAG }),
      Promise.all(
        fullRelayers.map((relayer) =>
          getCachedTokenBalance(
            destinationChainId,
            relayer,
            outputToken.address
          )
        )
      ),
      Promise.all(
        transferRestrictedRelayers.map((relayer) =>
          getCachedTokenBalance(
            destinationChainId,
            relayer,
            outputToken.address
          )
        )
      ),
      Promise.all(
        fullRelayers.map((relayer) =>
          destinationChainId === 1
            ? ethers.BigNumber.from("0")
            : getCachedTokenBalance("1", relayer, l1Token.address)
        )
      ),
    ]);

    let { liquidReserves } = hubPool.interface.decodeFunctionResult(
      "pooledTokens",
      multicallOutput[1]
    );

    const lpCushion = ethers.utils.parseUnits(
      getLpCushion(l1Token.symbol, computedOriginChainId, destinationChainId),
      l1Token.decimals
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
            l1Token.decimals
          )
          .mul(ethers.utils.parseUnits("1"))
          .div(tokenPriceUsd);

    const transferBalances = fullRelayerBalances.map((balance, i) =>
      balance.add(fullRelayerMainnetBalances[i])
    );

    const maxDepositInstant = minBN(
      maxBN(...fullRelayerBalances, ...transferRestrictedBalances),
      liquidReserves
    ).toString();
    const recommendedDepositInstant = getRecommendedDepositInstantLimit(
      l1Token.symbol,
      computedOriginChainId,
      destinationChainId
    );
    const responseJson = {
      // Absolute minimum may be overridden by the environment.
      minDeposit: maxBN(minDeposit, minDepositFloor).toString(),
      maxDeposit: liquidReserves.toString(),
      // Note: max is used here rather than sum because relayers currently do not partial fill.
      maxDepositInstant,
      // Same as above.
      maxDepositShortDelay: minBN(
        maxBN(...transferBalances, ...transferRestrictedBalances),
        liquidReserves
      ).toString(),
      recommendedDepositInstant: recommendedDepositInstant
        ? ethers.utils
            .parseUnits(recommendedDepositInstant, l1Token.decimals)
            .toString()
        : maxDepositInstant,
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
