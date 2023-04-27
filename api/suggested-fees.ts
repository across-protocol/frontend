// Note: ideally this would be written in ts as vercel claims they support it natively.
// However, when written in ts, the imports seem to fail, so this is in js for now.

import * as sdk from "@across-protocol/sdk-v2";
import { BlockFinder } from "@uma/sdk";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { type, assert, Infer, optional } from "superstruct";
import { disabledL1Tokens, DEFAULT_QUOTE_TIMESTAMP_BUFFER } from "./_constants";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  getTokenDetails,
  InputError,
  infuraProvider,
  getRelayerFeeDetails,
  isRouteEnabled,
  getCachedTokenPrice,
  handleErrorCondition,
  parsableBigNumberString,
  validAddress,
  positiveIntStr,
  boolStr,
  HUP_POOL_CHAIN_ID,
  ENABLED_ROUTES,
} from "./_utils";

const SuggestedFeesQueryParamsSchema = type({
  amount: parsableBigNumberString(),
  token: validAddress(),
  destinationChainId: positiveIntStr(),
  originChainId: optional(positiveIntStr()),
  timestamp: optional(positiveIntStr()),
  skipAmountLimit: optional(boolStr()),
});

type SuggestedFeesQueryParams = Infer<typeof SuggestedFeesQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<SuggestedFeesQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "SuggestedFees",
    message: "Query data",
    query,
  });
  try {
    const { QUOTE_TIMESTAMP_BUFFER, QUOTE_TIMESTAMP_PRECISION } = process.env;
    const quoteTimeBuffer = QUOTE_TIMESTAMP_BUFFER
      ? Number(QUOTE_TIMESTAMP_BUFFER)
      : DEFAULT_QUOTE_TIMESTAMP_BUFFER;

    const provider = infuraProvider(HUP_POOL_CHAIN_ID);

    assert(query, SuggestedFeesQueryParamsSchema);

    let {
      amount: amountInput,
      token,
      destinationChainId,
      originChainId,
      timestamp,
      skipAmountLimit,
    } = query;

    if (originChainId === destinationChainId) {
      throw new InputError("Origin and destination chains cannot be the same");
    }

    token = ethers.utils.getAddress(token);

    // Note: Add a buffer to "latest" timestamp so that it corresponds to a block
    // older than HEAD. This is to improve relayer UX who have heightened risk of sending inadvertent invalid
    // fills for quote times right at HEAD (or worst, in the future of HEAD). If timestamp is supplied as a query param,
    // then no need to apply buffer.
    const _parsedTimestamp = timestamp
      ? Number(timestamp)
      : (await provider.getBlock("latest")).timestamp - quoteTimeBuffer;

    // Round timestamp. Assuming that depositors use this timestamp as the `quoteTimestamp` will allow relayers
    // to take advantage of cached block-for-timestamp values when computing LP fee %'s. Currently the relayer is assumed
    // to first find the block for deposit's `quoteTimestamp` and then call `HubPool#liquidityUtilization` at that block
    // height to derive the LP fee. The expensive operation is finding a block for a timestamp and involves a binary search.
    // We can use rounding here to increase the chance that a deposit's quote timestamp is re-used, thereby
    // allowing relayers hit the cache more often when fetching a block for a timestamp.
    // Divide by intended precision in seconds, round down to nearest integer, multiply by precision in seconds.
    const precision = QUOTE_TIMESTAMP_PRECISION
      ? Number(QUOTE_TIMESTAMP_PRECISION)
      : DEFAULT_QUOTE_TIMESTAMP_BUFFER;
    const parsedTimestamp =
      Math.floor(_parsedTimestamp / precision) * precision;

    const amount = ethers.BigNumber.from(amountInput);

    let {
      l1Token,
      hubPool,
      chainId: computedOriginChainId,
    } = await getTokenDetails(
      provider,
      undefined, // Search by l2Token only.
      token,
      originChainId
    );

    const blockFinder = new BlockFinder(provider.getBlock.bind(provider));
    const [{ number: blockTag }, routeEnabled] = await Promise.all([
      blockFinder.getBlockForTimestamp(parsedTimestamp),
      isRouteEnabled(computedOriginChainId, Number(destinationChainId), token),
    ]);

    if (!routeEnabled || disabledL1Tokens.includes(l1Token.toLowerCase()))
      throw new InputError(`Route is not enabled.`);

    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      ENABLED_ROUTES.acrossConfigStoreAddress,
      provider
    );

    const baseCurrency = destinationChainId === "137" ? "matic" : "eth";

    const [currentUt, nextUt, rateModel, tokenPrice] = await Promise.all([
      hubPool.callStatic.liquidityUtilizationCurrent(l1Token, {
        blockTag,
      }),
      hubPool.callStatic.liquidityUtilizationPostRelay(l1Token, amount, {
        blockTag,
      }),
      configStoreClient.getRateModel(
        l1Token,
        {
          blockTag,
        },
        computedOriginChainId,
        Number(destinationChainId)
      ),
      getCachedTokenPrice(l1Token, baseCurrency),
    ]);
    const realizedLPFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );
    const relayerFeeDetails = await getRelayerFeeDetails(
      l1Token,
      amount,
      computedOriginChainId,
      Number(destinationChainId),
      tokenPrice
    );

    const skipAmountLimitEnabled = skipAmountLimit === "true";

    if (!skipAmountLimitEnabled && relayerFeeDetails.isAmountTooLow)
      throw new InputError("Sent amount is too low relative to fees");

    const responseJson = {
      capitalFeePct: relayerFeeDetails.capitalFeePercent,
      capitalFeeTotal: relayerFeeDetails.capitalFeeTotal,
      relayGasFeePct: relayerFeeDetails.gasFeePercent,
      relayGasFeeTotal: relayerFeeDetails.gasFeeTotal,
      relayFeePct: relayerFeeDetails.relayFeePercent,
      relayFeeTotal: relayerFeeDetails.relayFeeTotal,
      lpFeePct: realizedLPFeePct.toString(),
      timestamp: parsedTimestamp.toString(),
      isAmountTooLow: relayerFeeDetails.isAmountTooLow,
      quoteBlock: blockTag.toString(),
    };

    logger.debug({
      at: "SuggestedFees",
      message: "Response data",
      responseJson,
    });

    response.status(200).json(responseJson);
  } catch (error) {
    return handleErrorCondition("suggested-fees", response, logger, error);
  }
};

export default handler;
