import * as sdk from "@across-protocol/sdk";
import { BigNumber, ethers } from "ethers";
import { Span } from "@opentelemetry/api";

import {
  getCachedTokenPrice,
  getProvider,
  InputError,
  latestGasPriceCache,
  getLogger,
  getWrappedNativeTokenAddress,
  getTokenByAddress,
} from "../../_utils";
import { buildCrossSwapTxForAllowanceHolder } from "./_utils";
import {
  handleBaseSwapQueryParams,
  BaseSwapQueryParams,
  getApprovalTxns,
  buildBaseSwapResponseJson,
  handleSwapBody,
  SwapBody,
} from "../_utils";
import { getBalanceAndAllowance } from "../../_erc20";
import { getCrossSwapQuotes } from "../../_dexes/cross-swap-service";
import { inferCrossSwapType } from "../../_dexes/utils";
import { quoteFetchStrategies } from "../_configs";
import { TypedVercelRequest } from "../../_types";
import { AcrossErrorCode } from "../../_errors";

const logger = getLogger();

export async function handleApprovalSwap(
  request: TypedVercelRequest<BaseSwapQueryParams, SwapBody>,
  span?: Span
) {
  // This handler supports both GET and POST requests.
  // For GET requests, we expect the body to be empty.
  // TODO: Allow only POST requests
  if (request.method !== "POST" && request.body) {
    throw new InputError({
      message: "POST method required when request.body is provided",
      code: AcrossErrorCode.INVALID_METHOD,
    });
  }

  const {
    integratorId,
    skipOriginTxEstimation,
    isInputNative,
    isOutputNative,
    inputToken,
    outputToken,
    amount,
    amountType,
    refundOnOrigin,
    refundAddress,
    recipient,
    depositor,
    slippageTolerance: _slippageTolerance, // DEPRECATED: slippage expressed as 0 <= slippage <= 100, 1 = 1%
    slippage, // slippage expressed as 0 <= slippage <= 1, 0.01 = 1%
    excludeSources,
    includeSources,
    appFeePercent,
    appFeeRecipient,
    strictTradeType,
    skipChecks,
    isDestinationSvm,
  } = await handleBaseSwapQueryParams(request.query);

  const { actions } =
    request.body && Object.keys(request.body).length > 0
      ? handleSwapBody(request.body, Number(request.query.destinationChainId))
      : { actions: [] };

  const slippageTolerance = _slippageTolerance ?? slippage * 100;

  const crossSwapQuotes = await getCrossSwapQuotes(
    {
      amount,
      inputToken,
      outputToken,
      depositor,
      recipient: recipient || depositor,
      slippageTolerance,
      type: amountType,
      refundOnOrigin,
      refundAddress,
      isInputNative,
      isOutputNative,
      excludeSources,
      includeSources,
      embeddedActions: actions,
      appFeePercent,
      appFeeRecipient,
      strictTradeType,
      isDestinationSvm,
    },
    quoteFetchStrategies
  );
  const crossSwapType = inferCrossSwapType(crossSwapQuotes);
  logger.debug({
    at: "handleApprovalSwap",
    message: "Cross swap quotes",
    crossSwapType,
    amountType,
    crossSwapQuotes,
  });

  const crossSwapTx = await buildCrossSwapTxForAllowanceHolder(
    crossSwapQuotes,
    integratorId
  );

  const {
    originSwapQuote,
    bridgeQuote,
    destinationSwapQuote,
    crossSwap,
    appFee,
  } = crossSwapQuotes;

  const originChainId = crossSwap.inputToken.chainId;
  const destinationChainId = crossSwap.outputToken.chainId;
  const inputTokenAddress = isInputNative
    ? ethers.constants.AddressZero
    : crossSwap.inputToken.address;
  const inputAmount =
    originSwapQuote?.maximumAmountIn || bridgeQuote.inputAmount;

  let allowance = BigNumber.from(0);
  let balance = BigNumber.from(0);
  if (!skipChecks) {
    const checks = await getBalanceAndAllowance({
      chainId: originChainId,
      tokenAddress: inputTokenAddress,
      owner: crossSwap.depositor,
      spender: crossSwapTx.to,
    });
    allowance = checks.allowance;
    balance = checks.balance;
  }

  const isSwapTxEstimationPossible =
    !skipOriginTxEstimation &&
    allowance.gte(inputAmount) &&
    balance.gte(inputAmount);
  const provider = getProvider(originChainId);
  const originChainGasToken = getTokenByAddress(
    getWrappedNativeTokenAddress(originChainId),
    originChainId
  );
  const destinationChainGasToken = getTokenByAddress(
    getWrappedNativeTokenAddress(destinationChainId),
    destinationChainId
  );
  const bridgeQuoteInputToken = getTokenByAddress(
    bridgeQuote.inputToken.address,
    bridgeQuote.inputToken.chainId
  );

  const [
    originTxGas,
    originTxGasPrice,
    inputTokenPriceUsd,
    outputTokenPriceUsd,
    originNativePriceUsd,
    destinationNativePriceUsd,
    bridgeQuoteInputTokenPriceUsd,
  ] = await Promise.all([
    isSwapTxEstimationPossible
      ? provider.estimateGas({
          ...crossSwapTx,
          from: crossSwap.depositor,
        })
      : undefined,
    latestGasPriceCache(originChainId).get(),
    getCachedTokenPrice({
      symbol: inputToken.symbol,
      tokenAddress: inputToken.address,
      baseCurrency: "usd",
      chainId: inputToken.chainId,
      fallbackResolver: "lifi",
    }),
    getCachedTokenPrice({
      symbol: outputToken.symbol,
      tokenAddress: outputToken.address,
      baseCurrency: "usd",
      chainId: outputToken.chainId,
      fallbackResolver: "lifi",
    }),
    originChainGasToken
      ? getCachedTokenPrice({
          symbol: originChainGasToken.symbol,
          tokenAddress: originChainGasToken.addresses[originChainId],
          baseCurrency: "usd",
          chainId: originChainId,
          fallbackResolver: "lifi",
        })
      : 0,
    destinationChainGasToken
      ? getCachedTokenPrice({
          symbol: destinationChainGasToken.symbol,
          tokenAddress: destinationChainGasToken.addresses[destinationChainId],
          baseCurrency: "usd",
          chainId: destinationChainId,
          fallbackResolver: "lifi",
        })
      : 0,
    bridgeQuoteInputToken
      ? getCachedTokenPrice({
          symbol: bridgeQuoteInputToken.symbol,
          tokenAddress: bridgeQuoteInputToken.addresses[originChainId],
          baseCurrency: "usd",
          chainId: originChainId,
          fallbackResolver: "lifi",
        })
      : 0,
  ]);

  let approvalTxns:
    | {
        chainId: number;
        to: string;
        data: string;
      }[]
    | undefined;
  // @TODO: Allow for just enough approval amount to be set.
  const approvalAmount = ethers.constants.MaxUint256;
  if (allowance.lt(inputAmount)) {
    approvalTxns = getApprovalTxns({
      allowance,
      token: crossSwap.inputToken,
      spender: crossSwapTx.to,
      amount: approvalAmount,
    });
  }

  const responseJson = await buildBaseSwapResponseJson({
    amountType,
    amount,
    originChainId,
    destinationChainId,
    inputTokenAddress,
    inputAmount,
    approvalSwapTx: {
      ...crossSwapTx,
      gas: originTxGas,
      maxFeePerGas: (originTxGasPrice as sdk.gasPriceOracle.EvmGasPriceEstimate)
        ?.maxFeePerGas,
      maxPriorityFeePerGas: (
        originTxGasPrice as sdk.gasPriceOracle.EvmGasPriceEstimate
      )?.maxPriorityFeePerGas,
    },
    allowance,
    balance,
    approvalTxns,
    originSwapQuote,
    bridgeQuote,
    refundOnOrigin,
    destinationSwapQuote,
    appFeePercent,
    appFee,
    inputTokenPriceUsd,
    outputTokenPriceUsd,
    originNativePriceUsd,
    destinationNativePriceUsd,
    bridgeQuoteInputTokenPriceUsd,
    crossSwapType,
    logger,
  });

  if (span) {
    setSpanAttributes(span, responseJson);
  }

  return responseJson;
}

function setSpanAttributes(
  span: Span,
  responseJson: Awaited<ReturnType<typeof handleApprovalSwap>>
) {
  span.setAttribute("swap.type", responseJson.crossSwapType);
  span.setAttribute("swap.tradeType", responseJson.amountType);
  span.setAttribute("swap.originChainId", responseJson.inputToken.chainId);
  span.setAttribute(
    "swap.destinationChainId",
    responseJson.outputToken.chainId
  );
  span.setAttribute("swap.inputToken.address", responseJson.inputToken.address);
  span.setAttribute("swap.inputToken.symbol", responseJson.inputToken.symbol);
  span.setAttribute("swap.inputToken.chainId", responseJson.inputToken.chainId);
  span.setAttribute(
    "swap.outputToken.address",
    responseJson.outputToken.address
  );
  span.setAttribute("swap.outputToken.symbol", responseJson.outputToken.symbol);
  span.setAttribute(
    "swap.outputToken.chainId",
    responseJson.outputToken.chainId
  );
  span.setAttribute("swap.inputAmount", responseJson.inputAmount.toString());
  span.setAttribute(
    "swap.minOutputAmount",
    responseJson.minOutputAmount.toString()
  );
  span.setAttribute(
    "swap.expectedOutputAmount",
    responseJson.expectedOutputAmount.toString()
  );

  if (responseJson.steps.originSwap) {
    span.setAttribute(
      "swap.originSwap.route",
      [
        responseJson.steps.originSwap.tokenIn.symbol,
        responseJson.steps.originSwap.tokenOut.symbol,
      ].join(" -> ")
    );
    span.setAttribute(
      "swap.originSwap.swapProvider.name",
      responseJson.steps.originSwap.swapProvider.name
    );
    span.setAttribute(
      "swap.originSwap.swapProvider.sources",
      responseJson.steps.originSwap.swapProvider.sources
    );
  }

  if (responseJson.steps.destinationSwap) {
    span.setAttribute(
      "swap.destinationSwap.route",
      [
        responseJson.steps.destinationSwap.tokenIn.symbol,
        responseJson.steps.destinationSwap.tokenOut.symbol,
      ].join(" -> ")
    );
    span.setAttribute(
      "swap.destinationSwap.swapProvider.name",
      responseJson.steps.destinationSwap.swapProvider.name
    );
    span.setAttribute(
      "swap.destinationSwap.swapProvider.sources",
      responseJson.steps.destinationSwap.swapProvider.sources
    );
  }
}
