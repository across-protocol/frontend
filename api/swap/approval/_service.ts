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
  getBalance,
} from "../../_utils";
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
import { getBridgeStrategy } from "../../_bridges";
import { TypedVercelRequest } from "../../_types";
import { AcrossErrorCode } from "../../_errors";

const logger = getLogger();

export async function handleApprovalSwap(
  request: TypedVercelRequest<BaseSwapQueryParams, SwapBody>,
  span?: Span
) {
  // This handler supports both GET and POST requests.
  // For GET requests, we expect the body to be empty.
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
    isOriginSvm,
  } = await handleBaseSwapQueryParams(request.query);

  const { actions } =
    request.body && Object.keys(request.body).length > 0
      ? handleSwapBody(
          request.body,
          Number(request.query.destinationChainId),
          Number(request.query.originChainId)
        )
      : { actions: [] };

  const slippageTolerance = _slippageTolerance ?? slippage * 100;

  const bridgeStrategy = await getBridgeStrategy({
    originChainId: inputToken.chainId,
    destinationChainId: outputToken.chainId,
    inputToken,
    outputToken,
    amount,
    amountType,
    recipient,
    depositor,
    logger,
  });

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
      isOriginSvm,
    },
    quoteFetchStrategies,
    bridgeStrategy
  );
  const crossSwapType = inferCrossSwapType(crossSwapQuotes);
  logger.debug({
    at: "handleApprovalSwap",
    message: "Cross swap quotes",
    crossSwapType,
    amountType,
    crossSwapQuotes,
  });

  const crossSwapTx = await bridgeStrategy.buildTxForAllowanceHolder({
    quotes: crossSwapQuotes,
    integratorId,
  });

  const {
    originSwapQuote,
    bridgeQuote,
    destinationSwapQuote,
    crossSwap,
    appFee,
    indirectDestinationRoute,
  } = crossSwapQuotes;

  const originChainId = crossSwap.inputToken.chainId;
  const originTxChainId = crossSwapTx.chainId;
  const destinationChainId = crossSwap.outputToken.chainId;
  const intermediaryDestinationChainId =
    indirectDestinationRoute?.intermediaryOutputToken.chainId ||
    destinationChainId;
  const inputTokenAddress = isInputNative
    ? ethers.constants.AddressZero
    : crossSwap.inputToken.address;
  const inputAmount =
    originSwapQuote?.maximumAmountIn || bridgeQuote.inputAmount;

  let allowance = BigNumber.from(0);
  let balance = BigNumber.from(0);
  if (!skipChecks) {
    if (
      crossSwapTx.ecosystem === "evm" &&
      bridgeStrategy.originTxNeedsAllowance
    ) {
      const checks = await getBalanceAndAllowance({
        chainId: originChainId,
        tokenAddress: inputTokenAddress,
        owner: crossSwap.depositor,
        spender: crossSwapTx.to,
      });
      allowance = checks.allowance;
      balance = checks.balance;
    } else if (
      crossSwapTx.ecosystem === "svm" ||
      (crossSwapTx.ecosystem === "evm" &&
        !bridgeStrategy.originTxNeedsAllowance)
    ) {
      const _balance = await getBalance(
        originChainId,
        crossSwap.depositor,
        inputTokenAddress
      );
      allowance = inputAmount;
      balance = _balance;
    }
  }

  const provider = getProvider(originTxChainId);
  const originChainGasToken = getTokenByAddress(
    getWrappedNativeTokenAddress(originTxChainId),
    originTxChainId
  );
  const destinationChainGasToken = getTokenByAddress(
    getWrappedNativeTokenAddress(intermediaryDestinationChainId),
    intermediaryDestinationChainId
  );
  const bridgeQuoteInputToken = getTokenByAddress(
    bridgeQuote.inputToken.address,
    bridgeQuote.inputToken.chainId
  );

  const getOriginTxGas = async () => {
    if (
      crossSwapTx.ecosystem === "svm" ||
      skipOriginTxEstimation ||
      allowance.lt(inputAmount) ||
      balance.lt(inputAmount)
    ) {
      return;
    }

    return provider.estimateGas({
      ...crossSwapTx,
      from: crossSwap.depositor,
    });
  };

  const [
    originTxGas,
    originTxGasPrice,
    inputTokenPriceUsd,
    outputTokenPriceUsd,
    originNativePriceUsd,
    destinationNativePriceUsd,
    bridgeQuoteInputTokenPriceUsd,
  ] = await Promise.all([
    getOriginTxGas(),
    crossSwapTx.ecosystem === "evm"
      ? latestGasPriceCache(originTxChainId).get()
      : undefined,
    getCachedTokenPrice({
      symbol: inputToken.symbol,
      tokenAddress: inputToken.address,
      baseCurrency: "usd",
      chainId: inputToken.chainId,
      fallbackResolver: "lifi",
    }),
    indirectDestinationRoute
      ? getCachedTokenPrice({
          symbol: indirectDestinationRoute.intermediaryOutputToken.symbol,
          tokenAddress:
            indirectDestinationRoute.intermediaryOutputToken.address,
          baseCurrency: "usd",
          chainId: indirectDestinationRoute.intermediaryOutputToken.chainId,
          fallbackResolver: "lifi",
        })
      : getCachedTokenPrice({
          symbol: outputToken.symbol,
          tokenAddress: outputToken.address,
          baseCurrency: "usd",
          chainId: outputToken.chainId,
          fallbackResolver: "lifi",
        }),
    originChainGasToken
      ? getCachedTokenPrice({
          symbol: originChainGasToken.symbol,
          tokenAddress: originChainGasToken.addresses[originTxChainId],
          baseCurrency: "usd",
          chainId: originTxChainId,
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
          tokenAddress: bridgeQuoteInputToken.addresses[originTxChainId],
          baseCurrency: "usd",
          chainId: originTxChainId,
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
  if (allowance.lt(inputAmount) && crossSwapTx.ecosystem === "evm") {
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
    originChainId: originTxChainId,
    destinationChainId,
    inputTokenAddress,
    inputAmount,
    approvalSwapTx:
      crossSwapTx.ecosystem === "evm"
        ? {
            ...crossSwapTx,
            gas: originTxGas,
            maxFeePerGas: (
              originTxGasPrice as sdk.gasPriceOracle.EvmGasPriceEstimate
            )?.maxFeePerGas,
            maxPriorityFeePerGas: (
              originTxGasPrice as sdk.gasPriceOracle.EvmGasPriceEstimate
            )?.maxPriorityFeePerGas,
          }
        : crossSwapTx,
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
    indirectDestinationRoute,
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
