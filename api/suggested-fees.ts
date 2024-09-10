import * as sdk from "@across-protocol/sdk";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { type, assert, Infer, optional, string, enums } from "superstruct";
import {
  DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
  DEFAULT_QUOTE_BLOCK_BUFFER,
} from "./_constants";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  InputError,
  getProvider,
  getCachedTokenPrice,
  handleErrorCondition,
  parsableBigNumberString,
  validAddress,
  positiveIntStr,
  boolStr,
  HUB_POOL_CHAIN_ID,
  ENABLED_ROUTES,
  getSpokePoolAddress,
  getDefaultRelayerAddress,
  getHubPool,
  callViaMulticall3,
  validateChainAndTokenParams,
  getCachedLimits,
  getCachedLatestBlock,
  validateDepositMessage,
} from "./_utils";
import { selectExclusiveRelayer } from "./_exclusivity";
import { resolveTiming, resolveRebalanceTiming } from "./_timings";
import { parseUnits } from "ethers/lib/utils";

const { BigNumber } = ethers;

const SuggestedFeesQueryParamsSchema = type({
  amount: parsableBigNumberString(),
  token: optional(validAddress()),
  inputToken: optional(validAddress()),
  outputToken: optional(validAddress()),
  destinationChainId: positiveIntStr(),
  originChainId: optional(positiveIntStr()),
  timestamp: optional(positiveIntStr()),
  skipAmountLimit: optional(boolStr()),
  message: optional(string()),
  recipient: optional(validAddress()),
  relayer: optional(validAddress()),
  depositMethod: optional(enums(["depositV3", "depositExclusive"])),
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
    const { QUOTE_BLOCK_BUFFER, QUOTE_BLOCK_PRECISION } = process.env;

    const provider = getProvider(HUB_POOL_CHAIN_ID);
    const hubPool = getHubPool(provider);

    assert(query, SuggestedFeesQueryParamsSchema);

    let {
      amount: amountInput,
      timestamp,
      skipAmountLimit,
      recipient,
      relayer,
      message,
      depositMethod = "depositV3",
    } = query;

    const {
      l1Token,
      inputToken,
      outputToken,
      destinationChainId,
      resolvedOriginChainId: computedOriginChainId,
    } = validateChainAndTokenParams(query);

    relayer ??= getDefaultRelayerAddress(destinationChainId, inputToken.symbol);
    recipient ??= DEFAULT_SIMULATED_RECIPIENT_ADDRESS;
    const depositWithMessage = sdk.utils.isDefined(message);
    if (depositWithMessage) {
      validateDepositMessage(
        recipient,
        destinationChainId,
        relayer,
        outputToken.address,
        amountInput,
        message
      );
    }

    const latestBlock = await getCachedLatestBlock(HUB_POOL_CHAIN_ID);

    // The actual `quoteTimestamp` will be derived from the `quoteBlockNumber` below. If the caller supplies a timestamp,
    // we use the method `BlockFinder.getBlockForTimestamp` to find the block number for that timestamp. If the caller does
    // not supply a timestamp, we generate a timestamp from the latest block number minus a buffer.
    let quoteBlockNumber: number;

    // Note: Add a buffer to "latest" block so that it corresponds to a block older than HEAD.
    // This is to improve relayer UX who have heightened risk of sending inadvertent invalid fills
    // for quote times right at HEAD (or worst, in the future of HEAD). If timestamp is supplied as
    // a query param, then no need to apply buffer.
    const quoteBlockBuffer = QUOTE_BLOCK_BUFFER
      ? Number(QUOTE_BLOCK_BUFFER)
      : DEFAULT_QUOTE_BLOCK_BUFFER;

    // If the caller did not supply a quote timestamp, generate one from the latest block number minus buffer.
    let parsedTimestamp = Number(timestamp);
    if (isNaN(parsedTimestamp)) {
      // Round block number. Assuming that depositors use this timestamp as the `quoteTimestamp` will allow relayers
      // to take advantage of cached block numbers for timestamp values when computing LP fee %'s. Currently the relayer is assumed
      // to first find the block for deposit's `quoteTimestamp` and then call `HubPool#liquidityUtilization` at that block
      // height to derive the LP fee. The expensive operation is finding a block for a timestamp and involves a binary search.
      // We can use rounding here to increase the chance that a deposit's quote timestamp is re-used, thereby
      // allowing relayers hit the cache more often when fetching a block for a timestamp.
      // Divide by intended precision in blocks, round down to nearest integer, multiply by precision in blocks.
      const precision = Number(QUOTE_BLOCK_PRECISION ?? quoteBlockBuffer);
      quoteBlockNumber =
        Math.floor((latestBlock.number - quoteBlockBuffer) / precision) *
        precision;
    }
    // If the caller supplied a timestamp, find the block number for that timestamp. This branch adds a bit of latency
    // to the response time as it requires a binary search to find the block number for the given timestamp.
    else {
      // Don't attempt to provide quotes for future timestamps.
      if (parsedTimestamp > latestBlock.timestamp) {
        throw new InputError("Invalid quote timestamp");
      }

      const blockFinder = new sdk.utils.BlockFinder(provider, [latestBlock]);
      const { number: blockNumberForTimestamp } =
        await blockFinder.getBlockForTimestamp(parsedTimestamp);
      quoteBlockNumber = blockNumberForTimestamp;
    }

    const amount = BigNumber.from(amountInput);

    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      ENABLED_ROUTES.acrossConfigStoreAddress,
      provider
    );

    // Aggregate multiple calls into a single multicall to decrease
    // opportunities for RPC calls to be delayed.
    const multiCalls = [
      {
        contract: hubPool,
        functionName: "liquidityUtilizationCurrent",
        args: [l1Token.address],
      },
      {
        contract: hubPool,
        functionName: "liquidityUtilizationPostRelay",
        args: [l1Token.address, amount],
      },
      {
        contract: hubPool,
        functionName: "getCurrentTime",
      },
      {
        contract: configStoreClient.contract,
        functionName: "l1TokenConfig",
        args: [l1Token.address],
      },
    ];

    const [
      [currentUt, nextUt, _quoteTimestamp, rawL1TokenConfig],
      tokenPriceUsd,
      limits,
    ] = await Promise.all([
      callViaMulticall3(provider, multiCalls, { blockTag: quoteBlockNumber }),
      getCachedTokenPrice(l1Token.address, "usd"),
      getCachedLimits(
        inputToken.address,
        outputToken.address,
        computedOriginChainId,
        destinationChainId,
        // Always pass amount since we get relayerFeeDetails (including gross fee amounts) from limits.
        amountInput,
        // Only pass in the following parameters if message is defined, otherwise leave them undefined so we are more
        // likely to hit the /limits cache using the above parameters that are not specific to this deposit.
        depositWithMessage ? recipient : undefined,
        depositWithMessage ? relayer : undefined,
        depositWithMessage ? message : undefined
      ),
    ]);
    const { maxDeposit, maxDepositInstant, minDeposit, relayerFeeDetails } =
      limits;
    const quoteTimestamp = parseInt(_quoteTimestamp.toString());

    const amountInUsd = amount
      .mul(parseUnits(tokenPriceUsd.toString(), 18))
      .div(parseUnits("1", inputToken.decimals));

    if (amount.gt(maxDeposit)) {
      throw new InputError(
        `Amount exceeds max. deposit limit: ${ethers.utils.formatUnits(
          maxDeposit,
          inputToken.decimals
        )} ${inputToken.symbol}`
      );
    }

    const parsedL1TokenConfig =
      sdk.contracts.acrossConfigStore.Client.parseL1TokenConfig(
        String(rawL1TokenConfig)
      );
    const routeRateModelKey = `${computedOriginChainId}-${destinationChainId}`;
    const rateModel =
      parsedL1TokenConfig.routeRateModel?.[routeRateModelKey] ||
      parsedL1TokenConfig.rateModel;
    const lpFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );
    const lpFeeTotal = amount.mul(lpFeePct).div(ethers.constants.WeiPerEther);

    const isAmountTooLow = BigNumber.from(amountInput).lt(minDeposit);

    const skipAmountLimitEnabled = skipAmountLimit === "true";
    if (!skipAmountLimitEnabled && isAmountTooLow) {
      throw new InputError("Sent amount is too low relative to fees");
    }

    // Across V3's new `deposit` function requires now a total fee that includes the LP fee
    const totalRelayFee = BigNumber.from(relayerFeeDetails.relayFeeTotal).add(
      lpFeeTotal
    );
    const totalRelayFeePct = BigNumber.from(
      relayerFeeDetails.relayFeePercent
    ).add(lpFeePct);

    const estimatedFillTimeSec = amount.gte(maxDepositInstant)
      ? resolveRebalanceTiming(String(destinationChainId))
      : resolveTiming(
          String(computedOriginChainId),
          String(destinationChainId),
          inputToken.symbol,
          amountInUsd
        );

    const { exclusiveRelayer, exclusivityPeriod } =
      await selectExclusiveRelayer(
        computedOriginChainId,
        destinationChainId,
        outputToken,
        amount.sub(totalRelayFee),
        amountInUsd,
        BigNumber.from(relayerFeeDetails.capitalFeePercent),
        estimatedFillTimeSec
      );
    const exclusivityDeadline =
      depositMethod === "depositExclusive" ? exclusivityPeriod : 0;

    const responseJson = {
      estimatedFillTimeSec,
      capitalFeePct: relayerFeeDetails.capitalFeePercent,
      capitalFeeTotal: relayerFeeDetails.capitalFeeTotal,
      relayGasFeePct: relayerFeeDetails.gasFeePercent,
      relayGasFeeTotal: relayerFeeDetails.gasFeeTotal,
      relayFeePct: totalRelayFeePct.toString(), // capitalFeePct + gasFeePct + lpFeePct
      relayFeeTotal: totalRelayFee.toString(), // capitalFeeTotal + gasFeeTotal + lpFeeTotal
      lpFeePct: "0", // Note: lpFeePct is now included in relayFeePct. We set it to 0 here for backwards compatibility.
      timestamp: isNaN(parsedTimestamp)
        ? quoteTimestamp.toString()
        : parsedTimestamp.toString(),
      isAmountTooLow,
      quoteBlock: quoteBlockNumber.toString(),
      exclusiveRelayer,
      exclusivityDeadline,
      spokePoolAddress: getSpokePoolAddress(Number(computedOriginChainId)),
      destinationSpokePoolAddress: getSpokePoolAddress(destinationChainId),
      // Note: v3's new fee structure. Below are the correct values for the new fee structure. The above `*Pct` and `*Total`
      // values are for backwards compatibility which will be removed in the future.
      totalRelayFee: {
        // capitalFee + gasFee + lpFee
        pct: totalRelayFeePct.toString(),
        total: totalRelayFee.toString(),
      },
      relayerCapitalFee: {
        pct: relayerFeeDetails.capitalFeePercent,
        total: relayerFeeDetails.capitalFeeTotal,
      },
      relayerGasFee: {
        pct: relayerFeeDetails.gasFeePercent,
        total: relayerFeeDetails.gasFeeTotal,
      },
      lpFee: {
        pct: lpFeePct.toString(),
        total: lpFeeTotal.toString(),
      },
      limits,
    };

    logger.debug({
      at: "SuggestedFees",
      message: "Response data",
      responseJson,
    });

    response.setHeader("Cache-Control", "s-maxage=10");
    response.status(200).json(responseJson);
  } catch (error) {
    return handleErrorCondition("suggested-fees", response, logger, error);
  }
};

export default handler;
