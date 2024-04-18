import * as sdk from "@across-protocol/sdk-v2";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { type, assert, Infer, optional, string } from "superstruct";
import {
  DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
  DEFAULT_QUOTE_BLOCK_BUFFER,
} from "./_constants";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  InputError,
  getProvider,
  getRelayerFeeDetails,
  getCachedTokenPrice,
  handleErrorCondition,
  parsableBigNumberString,
  validAddress,
  positiveIntStr,
  boolStr,
  HUB_POOL_CHAIN_ID,
  ENABLED_ROUTES,
  getSpokePoolAddress,
  getCachedTokenBalance,
  getDefaultRelayerAddress,
  getHubPool,
  callViaMulticall3,
  validateChainAndTokenParams,
} from "./_utils";

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
    } = query;

    const {
      l1Token,
      inputToken,
      outputToken,
      destinationChainId,
      resolvedOriginChainId: computedOriginChainId,
    } = validateChainAndTokenParams(query);

    relayer ??= getDefaultRelayerAddress(inputToken.symbol, destinationChainId);
    recipient ??= DEFAULT_SIMULATED_RECIPIENT_ADDRESS;

    if (sdk.utils.isDefined(message) && !sdk.utils.isMessageEmpty(message)) {
      if (!ethers.utils.isHexString(message)) {
        throw new InputError("Message must be a hex string");
      }
      if (message.length % 2 !== 0) {
        // Our message encoding is a hex string, so we need to check that the length is even.
        throw new InputError("Message must be an even hex string");
      }
      const isRecipientAContract = await sdk.utils.isContractDeployedToAddress(
        recipient,
        getProvider(destinationChainId)
      );
      if (!isRecipientAContract) {
        throw new InputError(
          "Recipient must be a contract when a message is provided"
        );
      } else {
        // If we're in this case, it's likely that we're going to have to simulate the execution of
        // a complex message handling from the specified relayer to the specified recipient by calling
        // the arbitrary function call `handleAcrossMessage` at the recipient. So that we can discern
        // the difference between an OUT_OF_FUNDS error in either the transfer or through the execution
        // of the `handleAcrossMessage` we will check that the balance of the relayer is sufficient to
        // support this deposit.
        const balanceOfToken = await getCachedTokenBalance(
          destinationChainId,
          relayer,
          outputToken.address
        );
        if (balanceOfToken.lt(amountInput)) {
          throw new InputError(
            `Relayer Address (${relayer}) doesn't have enough funds to support this deposit;` +
              ` for help, please reach out to https://discord.across.to`
          );
        }
      }
    }

    const latestBlock = await provider.getBlock("latest");

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

    const amount = ethers.BigNumber.from(amountInput);

    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      ENABLED_ROUTES.acrossConfigStoreAddress,
      provider
    );

    const baseCurrency = destinationChainId === 137 ? "matic" : "eth";

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
    ];

    const [[currentUt, nextUt, quoteTimestamp], rateModel, tokenPrice] =
      await Promise.all([
        callViaMulticall3(provider, multiCalls, { blockTag: quoteBlockNumber }),
        configStoreClient.getRateModel(
          l1Token.address,
          {
            blockTag: quoteBlockNumber,
          },
          computedOriginChainId,
          destinationChainId
        ),
        getCachedTokenPrice(l1Token.address, baseCurrency),
      ]);
    const lpFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );
    const lpFeeTotal = amount.mul(lpFeePct).div(ethers.constants.WeiPerEther);
    const relayerFeeDetails = await getRelayerFeeDetails(
      l1Token.address,
      amount,
      computedOriginChainId,
      destinationChainId,
      recipient,
      tokenPrice,
      message,
      relayer
    );

    const skipAmountLimitEnabled = skipAmountLimit === "true";

    if (!skipAmountLimitEnabled && relayerFeeDetails.isAmountTooLow)
      throw new InputError("Sent amount is too low relative to fees");

    // Across V3's new `deposit` function requires now a total fee that includes the LP fee
    const totalRelayFee = ethers.BigNumber.from(
      relayerFeeDetails.relayFeeTotal
    ).add(lpFeeTotal);
    const totalRelayFeePct = ethers.BigNumber.from(
      relayerFeeDetails.relayFeePercent
    ).add(lpFeePct);

    const responseJson = {
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
      isAmountTooLow: relayerFeeDetails.isAmountTooLow,
      quoteBlock: quoteBlockNumber.toString(),
      spokePoolAddress: getSpokePoolAddress(Number(computedOriginChainId)),
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
