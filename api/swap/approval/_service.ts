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
  getCachedLimits,
  getHubPool,
  callViaMulticall3,
  HUB_POOL_CHAIN_ID,
} from "../../_utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../_constants";
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

/**
 * Fetches bridge limits and utilization data in parallel to determine strategy requirements
 */
async function getBridgeStrategyData({
  inputToken,
  outputToken,
  amount,
  recipient,
  depositor,
}: {
  inputToken: { address: string; chainId: number };
  outputToken: { address: string; chainId: number };
  amount: BigNumber;
  recipient?: string;
  depositor: string;
}): Promise<{
  canFillInstantly: boolean;
  isUtilizationHigh: boolean;
  isUsdcToUsdc: boolean;
  isLargeDeposit: boolean;
  isFastCctpEligible: boolean;
  isLineaSource: boolean;
}> {
  const startTime = Date.now();
  logger.debug({
    at: "getBridgeStrategyData",
    message: "Starting bridge strategy data fetch",
    inputToken: inputToken.address,
    outputToken: outputToken.address,
    amount: amount.toString(),
  });

  try {
    // Get token details for symbol and decimals first
    const inputTokenDetails = getTokenByAddress(
      inputToken.address,
      inputToken.chainId
    );
    if (!inputTokenDetails) {
      throw new Error(
        `Input token not found for address ${inputToken.address}`
      );
    }

    // Get L1 token address using TOKEN_SYMBOLS_MAP logic
    const l1TokenAddress =
      TOKEN_SYMBOLS_MAP[
        inputTokenDetails.symbol as keyof typeof TOKEN_SYMBOLS_MAP
      ]?.addresses[HUB_POOL_CHAIN_ID];
    if (!l1TokenAddress) {
      throw new Error(
        `L1 token not found for symbol ${inputTokenDetails.symbol}`
      );
    }

    const l1Token = getTokenByAddress(l1TokenAddress, HUB_POOL_CHAIN_ID);
    if (!l1Token) {
      throw new Error(
        `L1 token details not found for address ${l1TokenAddress}`
      );
    }

    // Fetch limits, utilization data, and token price in parallel
    const parallelStartTime = Date.now();
    const [limits, pooledTokenData, inputTokenPriceUsd] = await Promise.all([
      // Get bridge limits
      getCachedLimits(
        inputToken.address,
        outputToken.address,
        inputToken.chainId,
        outputToken.chainId,
        amount.toString(),
        recipient || depositor
      ),
      // Get utilization data from HubPool
      (async () => {
        const provider = getProvider(HUB_POOL_CHAIN_ID);
        const hubPool = getHubPool(provider);

        const multicallOutput = await callViaMulticall3(provider, [
          {
            contract: hubPool,
            functionName: "sync",
            args: [l1TokenAddress],
          },
          {
            contract: hubPool,
            functionName: "pooledTokens",
            args: [l1TokenAddress],
          },
        ]);

        return multicallOutput[1]; // pooledTokens data
      })(),
      // Get input token price
      getCachedTokenPrice({
        tokenAddress: inputToken.address,
        chainId: inputToken.chainId,
      }),
    ]);
    const parallelExecutionTime = Date.now() - parallelStartTime;

    logger.debug({
      at: "getBridgeStrategyData",
      message: "Completed parallel data fetch",
      parallelExecutionTimeMs: parallelExecutionTime,
    });

    // Check if we can fill instantly
    const maxDepositInstant = BigNumber.from(limits.maxDepositInstant);
    const canFillInstantly = amount.lte(maxDepositInstant);

    // Check if utilization is high (>80%)
    const { liquidReserves, utilizedReserves } = pooledTokenData;
    const utilizationThreshold = sdk.utils.fixedPointAdjustment
      .mul(80)
      .div(100); // 80%

    // Calculate current utilization percentage
    const currentUtilization = utilizedReserves
      .mul(sdk.utils.fixedPointAdjustment)
      .div(liquidReserves.add(utilizedReserves));

    const isUtilizationHigh = currentUtilization.gt(utilizationThreshold);

    // Get output token details
    const outputTokenDetails = getTokenByAddress(
      outputToken.address,
      outputToken.chainId
    );

    // Check if input and output tokens are both USDC
    const isUsdcToUsdc =
      inputTokenDetails?.symbol === "USDC" &&
      outputTokenDetails?.symbol === "USDC";

    // Check if deposit is > 1M USD
    const depositAmountUsd =
      parseFloat(
        ethers.utils.formatUnits(amount, inputTokenDetails?.decimals || 18)
      ) * inputTokenPriceUsd;
    const isLargeDeposit = depositAmountUsd > 1_000_000; // 1M USD

    // Check if eligible for Fast CCTP (Polygon, BSC, Solana) and deposit > 10K USD
    const fastCctpChains = [CHAIN_IDs.POLYGON, CHAIN_IDs.BSC, CHAIN_IDs.SOLANA];
    const isFastCctpChain =
      fastCctpChains.includes(inputToken.chainId) ||
      fastCctpChains.includes(outputToken.chainId);
    const isFastCctpEligible = isFastCctpChain && depositAmountUsd > 10_000; // 10K USD

    // Check if Linea is the source chain
    const isLineaSource = inputToken.chainId === CHAIN_IDs.LINEA;

    const executionTime = Date.now() - startTime;
    logger.debug({
      at: "getBridgeStrategyData",
      message: "Successfully completed bridge strategy data fetch",
      executionTimeMs: executionTime,
      results: {
        canFillInstantly,
        isUtilizationHigh,
        isUsdcToUsdc,
        isLargeDeposit,
        isFastCctpEligible,
        isLineaSource,
      },
    });

    return {
      canFillInstantly,
      isUtilizationHigh,
      isUsdcToUsdc,
      isLargeDeposit,
      isFastCctpEligible,
      isLineaSource,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.warn({
      at: "getBridgeStrategyData",
      message: "Failed to fetch bridge strategy data, using defaults",
      executionTimeMs: executionTime,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return safe defaults on error
    return {
      canFillInstantly: false,
      isUtilizationHigh: false,
      isUsdcToUsdc: false,
      isLargeDeposit: false,
      isFastCctpEligible: false,
      isLineaSource: false,
    };
  }
}

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

  // Get bridge strategy data (limits and utilization) in parallel
  const {
    canFillInstantly,
    isUtilizationHigh,
    isUsdcToUsdc,
    isLargeDeposit,
    isFastCctpEligible,
    isLineaSource,
  } = await getBridgeStrategyData({
    inputToken,
    outputToken,
    amount,
    recipient,
    depositor,
  });

  // TODO: Extend the strategy selection based on more sophisticated logic when we start
  // implementing burn/mint bridges.
  const bridgeStrategy = getBridgeStrategy({
    originChainId: inputToken.chainId,
    destinationChainId: outputToken.chainId,
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
    if (crossSwapTx.ecosystem === "evm") {
      const checks = await getBalanceAndAllowance({
        chainId: originChainId,
        tokenAddress: inputTokenAddress,
        owner: crossSwap.depositor,
        spender: crossSwapTx.to,
      });
      allowance = checks.allowance;
      balance = checks.balance;
    } else if (crossSwapTx.ecosystem === "svm") {
      const _balance = await getBalance(
        originChainId,
        crossSwap.depositor,
        inputTokenAddress
      );
      allowance = inputAmount;
      balance = _balance;
    }
  }

  const isSwapTxEstimationPossible =
    !skipOriginTxEstimation &&
    allowance.gte(inputAmount) &&
    balance.gte(inputAmount) &&
    // Skipping estimation for SVM for now
    crossSwapTx.ecosystem === "evm";
  const provider = getProvider(originChainId);
  const originChainGasToken = getTokenByAddress(
    getWrappedNativeTokenAddress(originChainId),
    originChainId
  );
  const destinationChainGasToken = getTokenByAddress(
    getWrappedNativeTokenAddress(intermediaryDestinationChainId),
    intermediaryDestinationChainId
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
    isSwapTxEstimationPossible
      ? latestGasPriceCache(originChainId).get()
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
    originChainId,
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
