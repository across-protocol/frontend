import * as sdk from "@across-protocol/sdk";
import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "./_types";
import { Infer, optional, string, type } from "superstruct";

import {
  HUB_POOL_CHAIN_ID,
  getLogger,
  getRelayerFeeDetails,
  handleErrorCondition,
  maxBN,
  minBN,
  positiveIntStr,
  sendResponse,
  validAddress,
  parsableBigNumberString,
  validateDepositMessage,
  getLimitCap,
  boolStr,
} from "./_utils";
import { MissingParamError } from "./_errors";
import {
  getFullRelayers,
  getTransferRestrictedRelayers,
} from "./_relayer-address";
import { calcGasFeeDetails } from "./_gas";
import {
  validateAndInitialize,
  setupMulticall,
  setupDepositAndGas,
  fetchTokenAndGasPrices,
  processRelayerBalances,
  processChainBoundariesAndDeposits,
  getDepositLimits,
  convertRelayerBalancesToInputDecimals,
} from "./helpers/limits-helper";

export const LimitsQueryParamsSchema = type({
  token: optional(validAddress()),
  inputToken: optional(validAddress()),
  outputToken: optional(validAddress()),
  destinationChainId: positiveIntStr(),
  originChainId: optional(positiveIntStr()),
  amount: optional(parsableBigNumberString()),
  message: optional(string()),
  recipient: optional(validAddress()),
  relayer: optional(validAddress()),
  allowUnmatchedDecimals: optional(boolStr()),
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
      provider,
      destinationChainId,
      computedOriginChainId,
      l1Token,
      inputToken,
      outputToken,
      amount,
      recipient,
      relayer,
      message,
      isMessageDefined,
      minDepositUsdForDestinationChainId,
    } = await validateAndInitialize(query);

    const fullRelayersL1 = getFullRelayers(HUB_POOL_CHAIN_ID);
    const fullRelayersDestinationChain = getFullRelayers(destinationChainId);
    const transferRestrictedRelayersDestinationChain =
      getTransferRestrictedRelayers(destinationChainId, l1Token.symbol);

    if (isMessageDefined) {
      if (!sdk.utils.isDefined(amount)) {
        throw new MissingParamError({
          message:
            "Parameter 'amount' must be defined when 'message' is defined",
          param: "amount",
        });
      }
      await validateDepositMessage(
        recipient.toBytes32(),
        destinationChainId,
        relayer.toBytes32(),
        outputToken.address,
        amount.toString(),
        message!
      );
    }

    const { multiCalls } = setupMulticall(
      provider,
      l1Token,
      computedOriginChainId,
      destinationChainId
    );

    const { depositArgs, shouldUseUnsignedFillForGasPriceCache } =
      setupDepositAndGas(
        amount,
        inputToken,
        outputToken,
        recipient,
        computedOriginChainId,
        destinationChainId,
        message
      );

    const {
      tokenPriceNative,
      tokenPriceUsd,
      latestBlock,
      gasPriceEstimate,
      nativeGasCost,
    } = await fetchTokenAndGasPrices(
      provider,
      l1Token,
      destinationChainId,
      depositArgs,
      shouldUseUnsignedFillForGasPriceCache,
      relayer,
      isMessageDefined
    );

    const {
      _liquidReserves,
      fullRelayerBalances,
      transferRestrictedBalances,
      transferBalances,
      routeInvolvesLiteChain,
      routeInvolvesUltraLightChain,
      opStackL1GasCost,
    } = await processRelayerBalances(
      provider,
      multiCalls,
      latestBlock,
      l1Token,
      inputToken,
      outputToken,
      computedOriginChainId,
      destinationChainId,
      fullRelayersDestinationChain,
      transferRestrictedRelayersDestinationChain,
      fullRelayersL1,
      depositArgs,
      relayer,
      nativeGasCost
    );

    // Convert all balances to input token decimals
    const {
      convertedLiquidReserves,
      convertedFullRelayerBalances,
      convertedTransferRestrictedBalances,
      convertedTransferBalances,
    } = convertRelayerBalancesToInputDecimals(
      {
        _liquidReserves,
        fullRelayerBalances,
        transferRestrictedBalances,
        fullRelayerMainnetBalances: fullRelayerBalances,
      },
      {
        l1TokenDecimals: l1Token.decimals,
        inputTokenDecimals: inputToken.decimals,
        outputTokenDecimals: outputToken.decimals,
      }
    );

    // Calculate gas fee details based on cached values
    const gasFeeDetails =
      nativeGasCost && gasPriceEstimate
        ? calcGasFeeDetails({
            gasPriceEstimate,
            nativeGasCost,
            opStackL1GasCost,
          })
        : undefined;
    const tokenGasCost = gasFeeDetails?.tokenGasCost;
    const gasPrice = gasFeeDetails?.gasPrice;

    // This call should not make any additional RPC queries since we are passing in gasPrice, nativeGasCost
    // and tokenGasCost.
    const relayerFeeDetails = await getRelayerFeeDetails(
      depositArgs,
      tokenPriceNative,
      relayer.toBytes32(),
      gasPrice,
      nativeGasCost,
      tokenGasCost
    );
    logger.debug({
      at: "Limits",
      message: "Relayer fee details from SDK",
      relayerFeeDetails,
    });

    const {
      minDeposit,
      minDepositFloor,
      maxDepositInstant,
      maxDepositShortDelay,
      liquidReserves,
    } = getDepositLimits(
      relayerFeeDetails,
      tokenPriceUsd,
      minDepositUsdForDestinationChainId,
      inputToken,
      convertedFullRelayerBalances,
      convertedTransferRestrictedBalances,
      convertedTransferBalances,
      convertedLiquidReserves,
      l1Token,
      computedOriginChainId,
      destinationChainId,
      routeInvolvesLiteChain,
      routeInvolvesUltraLightChain
    );

    const {
      minDeposit: processedMinDeposit,
      minDepositFloor: processedMinDepositFloor,
      maxDepositInstant: processedMaxDepositInstant,
      maxDepositShortDelay: processedMaxDepositShortDelay,
      maximumDeposit,
    } = await processChainBoundariesAndDeposits(
      provider,
      l1Token,
      inputToken,
      computedOriginChainId,
      destinationChainId,
      tokenPriceUsd,
      minDeposit,
      minDepositFloor,
      maxDepositInstant,
      maxDepositShortDelay,
      liquidReserves,
      routeInvolvesLiteChain,
      routeInvolvesUltraLightChain
    );

    const limitCap = getLimitCap(
      inputToken.symbol,
      inputToken.decimals,
      destinationChainId
    );

    const responseJson = {
      // Absolute minimum may be overridden by the environment.
      minDeposit: minBN(
        maximumDeposit,
        limitCap,
        maxBN(processedMinDeposit, processedMinDepositFloor)
      ).toString(),
      maxDeposit: minBN(maximumDeposit, limitCap).toString(),
      maxDepositInstant: minBN(processedMaxDepositInstant, limitCap).toString(),
      maxDepositShortDelay: minBN(
        processedMaxDepositShortDelay,
        limitCap
      ).toString(),
      recommendedDepositInstant: minBN(
        processedMaxDepositInstant,
        limitCap
      ).toString(),
      relayerFeeDetails: {
        relayFeeTotal: relayerFeeDetails.relayFeeTotal,
        relayFeePercent: relayerFeeDetails.relayFeePercent,
        gasFeeTotal: relayerFeeDetails.gasFeeTotal,
        gasFeePercent: relayerFeeDetails.gasFeePercent,
        capitalFeeTotal: relayerFeeDetails.capitalFeeTotal,
        capitalFeePercent: relayerFeeDetails.capitalFeePercent,
      },
      gasFeeDetails: gasFeeDetails
        ? {
            nativeGasCost: gasFeeDetails.nativeGasCost.toString(),
            opStackL1GasCost: gasFeeDetails.opStackL1GasCost?.toString(),
            gasPrice: gasFeeDetails.gasPrice.toString(),
            tokenGasCost: gasFeeDetails.tokenGasCost.toString(),
          }
        : undefined,
    };
    logger.debug({
      at: "Limits",
      message: "Response data",
      responseJson,
    });
    // Respond with a 200 status code and 1 second of cache time with
    // 59s to keep serving the stale data while recomputing the cached value.
    sendResponse(response, responseJson, 200, 1, 59);
  } catch (error: unknown) {
    return handleErrorCondition("limits", response, logger, error);
  }
};

export default handler;
