import * as sdk from "@across-protocol/sdk-v2";
import { BlockFinder } from "@uma/sdk";
import { VercelResponse } from "@vercel/node";
import { ethers } from "ethers";
import { type, assert, Infer, optional, string } from "superstruct";
import {
  disabledL1Tokens,
  DEFAULT_QUOTE_TIMESTAMP_BUFFER,
  TOKEN_SYMBOLS_MAP,
  DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
} from "./_constants";
import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  getTokenDetails,
  InputError,
  getProvider,
  getRelayerFeeDetails,
  isRouteEnabled,
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
  hasPotentialRouteCollision,
} from "./_utils";

const SuggestedFeesQueryParamsSchema = type({
  amount: parsableBigNumberString(),
  token: validAddress(),
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
    const { QUOTE_TIMESTAMP_BUFFER, QUOTE_TIMESTAMP_PRECISION } = process.env;
    const quoteTimeBuffer = QUOTE_TIMESTAMP_BUFFER
      ? Number(QUOTE_TIMESTAMP_BUFFER)
      : DEFAULT_QUOTE_TIMESTAMP_BUFFER;

    const provider = getProvider(HUB_POOL_CHAIN_ID);

    assert(query, SuggestedFeesQueryParamsSchema);

    let {
      amount: amountInput,
      token,
      destinationChainId: _destinationChainId,
      originChainId,
      timestamp,
      skipAmountLimit,
      recipient,
      relayer,
      message,
    } = query;

    if (originChainId === _destinationChainId) {
      throw new InputError("Origin and destination chains cannot be the same");
    }
    const destinationChainId = Number(_destinationChainId);
    token = ethers.utils.getAddress(token);

    const [latestBlock, tokenDetails] = await Promise.all([
      provider.getBlock("latest"),
      getTokenDetails(provider, undefined, token, originChainId),
    ]);
    const { l1Token, hubPool, chainId: computedOriginChainId } = tokenDetails;

    const tokenInformation = Object.values(TOKEN_SYMBOLS_MAP).find(
      (details) => details.addresses[HUB_POOL_CHAIN_ID] === l1Token
    );

    if (!sdk.utils.isDefined(tokenInformation)) {
      throw new InputError("Unsupported token address");
    }

    relayer ??= getDefaultRelayerAddress(
      tokenInformation.symbol,
      destinationChainId
    );
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
        const destinationToken =
          sdk.utils.getL2TokenAddresses(l1Token)?.[destinationChainId];
        if (!sdk.utils.isDefined(destinationToken)) {
          throw new InputError(
            `Could not resolve token address on ${destinationChainId} for ${l1Token}`
          );
        }
        const balanceOfToken = await getCachedTokenBalance(
          destinationChainId,
          relayer,
          destinationToken
        );
        if (balanceOfToken.lt(amountInput)) {
          throw new InputError(
            `Relayer Address (${relayer}) doesn't have enough funds to support this deposit;` +
              ` for help, please reach out to https://discord.across.to`
          );
        }
      }
    }

    // Note: Add a buffer to "latest" timestamp so that it corresponds to a block older than HEAD.
    // This is to improve relayer UX who have heightened risk of sending inadvertent invalid fills
    // for quote times right at HEAD (or worst, in the future of HEAD). If timestamp is supplied as
    // a query param, then no need to apply buffer.

    // If the caller did not supply a quote timestamp, generate one from the latest block number.
    let parsedTimestamp = Number(timestamp);
    if (isNaN(parsedTimestamp)) {
      // Round timestamp. Assuming that depositors use this timestamp as the `quoteTimestamp` will allow relayers
      // to take advantage of cached blocklatest block number.for-timestamp values when computing LP fee %'s. Currently the relayer is assumed
      // to first find the block for deposit's `quoteTimestamp` and then call `HubPool#liquidityUtilization` at that block
      // height to derive the LP fee. The expensive operation is finding a block for a timestamp and involves a binary search.
      // We can use rounding here to increase the chance that a deposit's quote timestamp is re-used, thereby
      // allowing relayers hit the cache more often when fetching a block for a timestamp.
      // Divide by intended precision in seconds, round down to nearest integer, multiply by precision in seconds.
      const precision = Number(
        QUOTE_TIMESTAMP_PRECISION ?? DEFAULT_QUOTE_TIMESTAMP_BUFFER
      );
      parsedTimestamp =
        Math.floor((latestBlock.timestamp - quoteTimeBuffer) / precision) *
        precision;
    }

    // Don't attempt to provide quotes for future timestamps.
    if (parsedTimestamp > latestBlock.timestamp) {
      throw new InputError("Invalid quote timestamp");
    }

    const amount = ethers.BigNumber.from(amountInput);

    const blockFinder = new BlockFinder(provider.getBlock.bind(provider));
    const [{ number: blockTag }, routeEnabled] = await Promise.all([
      blockFinder.getBlockForTimestamp(parsedTimestamp),
      isRouteEnabled(computedOriginChainId, destinationChainId, token),
    ]);

    if (disabledL1Tokens.includes(l1Token.toLowerCase())) {
      throw new InputError(`Route is not enabled.`);
    }
    if (!routeEnabled) {
      const routeCollision = await hasPotentialRouteCollision(
        provider,
        undefined,
        token,
        originChainId
      );
      throw new InputError(
        routeCollision
          ? `More than one ACX route maps to the provided inputs causing ambiguity. Please specify the originChainId.`
          : `Route is not enabled.`
      );
    }
    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      ENABLED_ROUTES.acrossConfigStoreAddress,
      provider
    );

    const baseCurrency = destinationChainId === 137 ? "matic" : "eth";

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
        destinationChainId
      ),
      getCachedTokenPrice(l1Token, baseCurrency),
    ]);
    const lpFeePct = sdk.lpFeeCalculator.calculateRealizedLpFeePct(
      rateModel,
      currentUt,
      nextUt
    );
    const lpFeeTotal = amount.mul(lpFeePct).div(ethers.constants.WeiPerEther);
    const relayerFeeDetails = await getRelayerFeeDetails(
      l1Token,
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
      timestamp: parsedTimestamp.toString(),
      isAmountTooLow: relayerFeeDetails.isAmountTooLow,
      quoteBlock: blockTag.toString(),
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
