import { Span } from "@opentelemetry/api";
import * as sdk from "@across-protocol/sdk";
import { BigNumber, constants, ethers } from "ethers";

import { TypedVercelRequest } from "../_types";
import {
  getBalance,
  getCachedTokenPrice,
  getLogger,
  getProvider,
  getTokenByAddress,
  getWrappedNativeTokenAddress,
  InputError,
  latestGasPriceCache,
} from "../_utils";
import { getBridgeStrategy } from "../_bridges";
import { getBalanceAndAllowance } from "../_erc20";
import { getCrossSwapQuotes } from "../_dexes/cross-swap-service";
import { inferCrossSwapType } from "../_dexes/utils";
import { quoteFetchStrategies } from "./_configs";
import {
  handleBaseSwapQueryParams,
  BaseSwapQueryParams,
  SwapBody,
  handleSwapBody,
  getApprovalTxns,
  buildBaseSwapResponseJson,
} from "./_utils";
import { AcrossErrorCode } from "../_errors";
import { CHAIN_IDs } from "../_constants";
import type { CrossSwapQuotes } from "../_dexes/types";
import type { OriginTx } from "../_bridges/types";

// Allows us to redirect the gas price cache chain ID to the mainnet chain ID for testnet chains
const gasPriceCacheChainIdRedirects: Record<number, number> = {
  [CHAIN_IDs.HYPEREVM_TESTNET]: CHAIN_IDs.HYPEREVM,
};

export async function handleSwap<T, U>(params: {
  request: TypedVercelRequest<BaseSwapQueryParams & T, SwapBody>;
  span?: Span;
  flow: "approval" | "erc3009";
  buildOriginTx: (context: {
    baseParams: Awaited<ReturnType<typeof handleBaseSwapQueryParams>>;
    bridgeStrategy: Awaited<ReturnType<typeof getBridgeStrategy>>;
    extendedParams?: U;
    crossSwapQuotes: CrossSwapQuotes;
    integratorId?: string;
  }) => Promise<OriginTx>;
  validateExtendedQueryParams?: (
    query: TypedVercelRequest<BaseSwapQueryParams & T, SwapBody>["query"]
  ) => U;
}) {
  const logger = getLogger();

  // This handler supports both GET and POST requests.
  // For GET requests, we expect the body to be empty.
  if (params.request.method !== "POST" && params.request.body) {
    throw new InputError({
      message: "POST method required when request.body is provided",
      code: AcrossErrorCode.INVALID_METHOD,
    });
  }

  const baseParams = await handleBaseSwapQueryParams(params.request.query);
  const extendedParams = params.validateExtendedQueryParams?.(
    params.request.query
  );

  const { actions } =
    params.request.body && Object.keys(params.request.body).length > 0
      ? handleSwapBody(
          params.request.body,
          Number(params.request.query.destinationChainId),
          Number(params.request.query.originChainId)
        )
      : { actions: [] };

  const slippageTolerance =
    baseParams.slippageTolerance ??
    (typeof baseParams.slippage === "number"
      ? baseParams.slippage * 100
      : "auto");

  const recipient = baseParams.recipient || baseParams.depositor;

  const bridgeStrategy = await getBridgeStrategy({
    originChainId: baseParams.inputToken.chainId,
    destinationChainId: baseParams.outputToken.chainId,
    inputToken: baseParams.inputToken,
    outputToken: baseParams.outputToken,
    amount: baseParams.amount,
    amountType: baseParams.amountType,
    recipient,
    depositor: baseParams.depositor,
    includesActions: actions.length > 0,
    includesAppFee: !!baseParams.appFeePercent && baseParams.appFeePercent > 0,
    routingPreference: baseParams.routingPreference,
  });

  const crossSwapQuotes = await getCrossSwapQuotes(
    {
      amount: baseParams.amount,
      inputToken: baseParams.inputToken,
      outputToken: baseParams.outputToken,
      depositor: baseParams.depositor,
      recipient,
      slippageTolerance,
      type: baseParams.amountType,
      refundOnOrigin: baseParams.refundOnOrigin,
      refundAddress: baseParams.refundAddress,
      isInputNative: baseParams.isInputNative,
      isOutputNative: baseParams.isOutputNative,
      excludeSources: baseParams.excludeSources,
      includeSources: baseParams.includeSources,
      embeddedActions: actions,
      appFeePercent: baseParams.appFeePercent,
      appFeeRecipient: baseParams.appFeeRecipient,
      strictTradeType: baseParams.strictTradeType,
      isDestinationSvm: baseParams.isDestinationSvm,
      isOriginSvm: baseParams.isOriginSvm,
    },
    quoteFetchStrategies,
    bridgeStrategy
  );
  const crossSwapType = inferCrossSwapType(crossSwapQuotes);

  logger.debug({
    at: `handleSwap/${params.flow}`,
    message: "Cross swap quotes",
    crossSwapType,
    amountType: baseParams.amountType,
    crossSwapQuotes,
  });

  const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
  const destinationChainId = crossSwapQuotes.crossSwap.outputToken.chainId;
  const intermediaryDestinationChainId =
    crossSwapQuotes.indirectDestinationRoute?.intermediaryOutputToken.chainId ??
    destinationChainId;
  const inputTokenAddress = baseParams.isInputNative
    ? constants.AddressZero
    : crossSwapQuotes.crossSwap.inputToken.address;
  const outputTokenAddress = baseParams.isOutputNative
    ? constants.AddressZero
    : crossSwapQuotes.crossSwap.outputToken.address;
  const inputAmount =
    crossSwapQuotes.originSwapQuote?.maximumAmountIn ??
    crossSwapQuotes.bridgeQuote.inputAmount;

  const originTx = await params.buildOriginTx({
    baseParams,
    bridgeStrategy,
    extendedParams,
    integratorId: baseParams.integratorId,
    crossSwapQuotes,
  });
  const originTxChainId = originTx.chainId;

  const executeChecks = async () => {
    let allowance = BigNumber.from(0);
    let balance = BigNumber.from(0);

    if (baseParams.skipChecks) {
      return { allowance, balance };
    }

    if (originTx.ecosystem === "evm" && bridgeStrategy.originTxNeedsAllowance) {
      const checks = await getBalanceAndAllowance({
        chainId: originChainId,
        tokenAddress: inputTokenAddress,
        owner: crossSwapQuotes.crossSwap.depositor,
        spender: originTx.to,
      });
      allowance = checks.allowance;
      balance = checks.balance;
    } else {
      balance = await getBalance(
        originChainId,
        crossSwapQuotes.crossSwap.depositor,
        inputTokenAddress
      );
      allowance = inputAmount;
    }
    return { allowance, balance };
  };

  const estimateOriginTxGas = async (checks: {
    allowance: BigNumber;
    balance: BigNumber;
  }) => {
    if (
      originTx.ecosystem === "svm" ||
      originTx.isGasless ||
      baseParams.skipOriginTxEstimation ||
      // Skip gas estimation if allowance or balance is insufficient, as the
      // simulation will fail. This matches the previous behavior.
      checks.allowance.lt(inputAmount) ||
      checks.balance.lt(inputAmount)
    ) {
      return { originTxGas: BigNumber.from(0), originTxGasPrice: undefined };
    }

    const provider = getProvider(originTxChainId);
    const [originTxGas, originTxGasPrice] = await Promise.all([
      provider.estimateGas({
        ...originTx,
        from: crossSwapQuotes.crossSwap.depositor,
        type: undefined,
      }),
      originTx.ecosystem === "evm"
        ? latestGasPriceCache(
            gasPriceCacheChainIdRedirects[originTxChainId] ?? originTxChainId
          ).get()
        : undefined,
    ]);
    return { originTxGas, originTxGasPrice };
  };

  const originChainGasToken = getTokenByAddress(
    getWrappedNativeTokenAddress(originTxChainId),
    originTxChainId
  );
  const destinationChainGasToken = getTokenByAddress(
    getWrappedNativeTokenAddress(intermediaryDestinationChainId),
    intermediaryDestinationChainId
  );
  const bridgeQuoteInputToken = getTokenByAddress(
    crossSwapQuotes.bridgeQuote.inputToken.address,
    crossSwapQuotes.bridgeQuote.inputToken.chainId
  );

  // Run checks first to get allowance and balance
  const [
    { allowance, balance },
    inputTokenPriceUsd,
    outputTokenPriceUsd,
    originNativePriceUsd,
    destinationNativePriceUsd,
    bridgeQuoteInputTokenPriceUsd,
  ] = await Promise.all([
    executeChecks(),
    getCachedTokenPrice({
      symbol: baseParams.inputToken.symbol,
      tokenAddress: baseParams.inputToken.address,
      baseCurrency: "usd",
      chainId: baseParams.inputToken.chainId,
      fallbackResolver: "lifi",
    }),
    crossSwapQuotes.indirectDestinationRoute
      ? getCachedTokenPrice({
          symbol:
            crossSwapQuotes.indirectDestinationRoute.intermediaryOutputToken
              .symbol,
          tokenAddress:
            crossSwapQuotes.indirectDestinationRoute.intermediaryOutputToken
              .address,
          baseCurrency: "usd",
          chainId:
            crossSwapQuotes.indirectDestinationRoute.intermediaryOutputToken
              .chainId,
          fallbackResolver: "lifi",
        })
      : getCachedTokenPrice({
          symbol: baseParams.outputToken.symbol,
          tokenAddress: baseParams.outputToken.address,
          baseCurrency: "usd",
          chainId: baseParams.outputToken.chainId,
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
          tokenAddress:
            destinationChainGasToken.addresses[intermediaryDestinationChainId],
          baseCurrency: "usd",
          chainId: intermediaryDestinationChainId,
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

  // Estimate gas after checks complete, as we need allowance/balance to decide
  // whether simulation would succeed
  const { originTxGas, originTxGasPrice } = await estimateOriginTxGas({
    allowance,
    balance,
  });

  let approvalTxns:
    | {
        chainId: number;
        to: string;
        data: string;
      }[]
    | undefined;
  // @TODO: Allow for just enough approval amount to be set.
  const approvalAmount = ethers.constants.MaxUint256;
  if (params.flow === "approval") {
    if (allowance.lt(inputAmount) && originTx.ecosystem === "evm") {
      approvalTxns = getApprovalTxns({
        allowance,
        token: crossSwapQuotes.crossSwap.inputToken,
        spender: originTx.to,
        amount: approvalAmount,
      });
    }
  }

  const responseJson = await buildBaseSwapResponseJson({
    depositId: originTx.isGasless ? originTx.data.depositId : undefined,
    amountType: baseParams.amountType,
    amount: baseParams.amount,
    originChainId: originTxChainId,
    destinationChainId,
    inputTokenAddress,
    outputTokenAddress,
    inputAmount,
    approvalSwapTx:
      originTx.ecosystem === "evm" && !originTx.isGasless
        ? {
            ...originTx,
            gas: originTxGas,
            maxFeePerGas: (
              originTxGasPrice as sdk.gasPriceOracle.EvmGasPriceEstimate
            )?.maxFeePerGas,
            maxPriorityFeePerGas: (
              originTxGasPrice as sdk.gasPriceOracle.EvmGasPriceEstimate
            )?.maxPriorityFeePerGas,
          }
        : originTx.ecosystem === "svm"
          ? originTx
          : undefined,
    permitSwapTx: originTx.isGasless ? originTx : undefined,
    allowance,
    balance,
    approvalTxns,
    originSwapQuote: crossSwapQuotes.originSwapQuote,
    bridgeQuote: crossSwapQuotes.bridgeQuote,
    refundOnOrigin: baseParams.refundOnOrigin,
    destinationSwapQuote: crossSwapQuotes.destinationSwapQuote,
    appFeePercent: baseParams.appFeePercent,
    appFee: crossSwapQuotes.appFee,
    inputTokenPriceUsd,
    outputTokenPriceUsd,
    originNativePriceUsd,
    destinationNativePriceUsd,
    bridgeQuoteInputTokenPriceUsd,
    crossSwapType: crossSwapType,
    indirectDestinationRoute: crossSwapQuotes.indirectDestinationRoute,
    logger,
  });

  if (params.span) {
    setSwapSpanAttributes(params.span, responseJson);
  }

  return responseJson;
}

export function setSwapSpanAttributes(
  span: Span,
  responseJson: Awaited<ReturnType<typeof buildBaseSwapResponseJson>>
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

  span.setAttribute(
    "swap.bridge.route",
    [
      responseJson.steps.bridge.tokenIn.symbol,
      responseJson.steps.bridge.tokenOut.symbol,
    ].join(" -> ")
  );
  span.setAttribute("swap.bridge.provider", responseJson.steps.bridge.provider);
  span.setAttribute(
    "swap.bridge.inputAmount",
    responseJson.steps.bridge.inputAmount.toString()
  );
  span.setAttribute(
    "swap.bridge.outputAmount",
    responseJson.steps.bridge.outputAmount.toString()
  );

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
    span.setAttribute(
      "swap.destinationSwap.inputAmount",
      responseJson.steps.destinationSwap.inputAmount.toString()
    );
    span.setAttribute(
      "swap.destinationSwap.outputAmount",
      responseJson.steps.destinationSwap.outputAmount.toString()
    );
    span.setAttribute(
      "swap.destinationSwap.minOutputAmount",
      responseJson.steps.destinationSwap.minOutputAmount.toString()
    );
    span.setAttribute(
      "swap.destinationSwap.maxInputAmount",
      responseJson.steps.destinationSwap.maxInputAmount.toString()
    );
  }
}
