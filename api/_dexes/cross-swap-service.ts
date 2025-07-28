import { TradeType } from "@uniswap/sdk-core";

import {
  getBridgeQuoteForMinOutput,
  getRouteByInputTokenAndDestinationChain,
  getRouteByOutputTokenAndOriginChain,
  getRoutesByChainIds,
  getTokenByAddress,
  getBridgeQuoteForExactInput,
  addTimeoutToPromise,
  getRejectedReasons,
  getLogger,
  addMarkupToAmount,
} from "../_utils";
import { CrossSwap, CrossSwapQuotes, QuoteFetchOpts } from "./types";
import {
  buildExactInputBridgeTokenMessage,
  buildExactOutputBridgeTokenMessage,
  buildMinOutputBridgeTokenMessage,
  calculateAppFee,
  getCrossSwapTypes,
  getPreferredBridgeTokens,
  getQuoteFetchStrategies,
  QuoteFetchPrioritizationMode,
  QuoteFetchStrategies,
} from "./utils";
import { getMultiCallHandlerAddress } from "../_multicall-handler";
import {
  defaultQuoteFetchStrategies,
  AMOUNT_TYPE,
  CROSS_SWAP_TYPE,
  buildDestinationSwapCrossChainMessage,
  assertMinOutputAmount,
} from "./utils";
import {
  SwapAmountTooLowForBridgeFeesError,
  InvalidParamError,
  SwapQuoteUnavailableError,
} from "../_errors";
import {
  CrossSwapQuotesRetrievalA2AResult,
  CrossSwapQuotesRetrievalA2BResult,
  CrossSwapQuotesRetrievalB2AResult,
} from "./types";

const QUOTE_BUFFER = 0.005; // 0.5%

const PROMISE_TIMEOUT_MS = 15_000;

const logger = getLogger();

export async function getCrossSwapQuotes(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies = defaultQuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  if (crossSwap.type === AMOUNT_TYPE.EXACT_INPUT) {
    return getCrossSwapQuoteForAmountType(crossSwap, strategies, {
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE]:
        getCrossSwapQuotesForExactInputB2B,
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY]: getCrossSwapQuotesForExactInputB2A,
      [CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE]: getCrossSwapQuotesForExactInputA2B,
      [CROSS_SWAP_TYPE.ANY_TO_ANY]: getCrossSwapQuotesA2A,
    });
  }

  if (
    crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT ||
    crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT
  ) {
    return getCrossSwapQuoteForAmountType(crossSwap, strategies, {
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE]:
        getCrossSwapQuotesForOutputB2B,
      [CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY]: getCrossSwapQuotesForOutputB2A,
      [CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE]: getCrossSwapQuotesForOutputA2B,
      [CROSS_SWAP_TYPE.ANY_TO_ANY]: getCrossSwapQuotesA2A,
    });
  }

  throw new InvalidParamError({
    message: `Failed to fetch swap quote: invalid amount type '${crossSwap.type}'`,
  });
}

function getCrossSwapQuoteForAmountType(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies,
  typeToHandler: Record<
    (typeof CROSS_SWAP_TYPE)[keyof typeof CROSS_SWAP_TYPE],
    (
      crossSwap: CrossSwap,
      strategies: QuoteFetchStrategies
    ) => Promise<CrossSwapQuotes>
  >
): Promise<CrossSwapQuotes> {
  const crossSwapTypes = getCrossSwapTypes({
    inputToken: crossSwap.inputToken.address,
    originChainId: crossSwap.inputToken.chainId,
    outputToken: crossSwap.outputToken.address,
    destinationChainId: crossSwap.outputToken.chainId,
    isInputNative: Boolean(crossSwap.isInputNative),
    isOutputNative: Boolean(crossSwap.isOutputNative),
  });

  const crossSwaps = crossSwapTypes.map((crossSwapType) => {
    const handler = typeToHandler[crossSwapType];
    if (!handler) {
      throw new InvalidParamError({
        message: `Failed to fetch swap quote: invalid cross swap type '${crossSwapType}'`,
      });
    }
    return handler(crossSwap, strategies);
  });

  return selectBestCrossSwapQuote(crossSwaps, crossSwap);
}

export async function getCrossSwapQuotesForExactInputB2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  // Use the first origin strategy since we don't need to fetch multiple origin quotes
  const originStrategy = getQuoteFetchStrategies(
    crossSwap.inputToken.chainId,
    crossSwap.inputToken.symbol,
    crossSwap.inputToken.symbol,
    strategies
  ).at(0);
  if (!originStrategy) {
    throw new InvalidParamError({
      message: `Failed to fetch swap quote: no origin strategy found for ${crossSwap.inputToken.symbol}`,
    });
  }

  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    exactInputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
    message: buildExactInputBridgeTokenMessage(crossSwap, crossSwap.amount),
  });

  if (bridgeQuote.outputAmount.lt(0)) {
    throw new SwapAmountTooLowForBridgeFeesError({
      bridgeAmount: crossSwap.amount.toString(),
      bridgeFee: bridgeQuote.suggestedFees.totalRelayFee.toString(),
    });
  }

  const appFee = calculateAppFee({
    outputAmount: bridgeQuote.outputAmount,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  bridgeQuote.message = buildExactInputBridgeTokenMessage(
    crossSwap,
    bridgeQuote.outputAmount,
    appFee
  );

  return {
    crossSwap,
    destinationSwapQuote: undefined,
    bridgeQuote,
    originSwapQuote: undefined,
    contracts: {
      depositEntryPoint: originStrategy.getOriginEntryPoints(
        crossSwap.inputToken.chainId
      ).deposit,
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForOutputB2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  // Use the first origin strategy since we don't need to fetch multiple origin quotes
  const originStrategy = getQuoteFetchStrategies(
    crossSwap.inputToken.chainId,
    crossSwap.inputToken.symbol,
    crossSwap.inputToken.symbol,
    strategies
  ).at(0);
  if (!originStrategy) {
    throw new InvalidParamError({
      message: `Failed to fetch swap quote: no origin strategy found for ${crossSwap.inputToken.symbol}`,
    });
  }

  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    minOutputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
    message:
      crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT
        ? buildExactOutputBridgeTokenMessage(crossSwap)
        : buildMinOutputBridgeTokenMessage(crossSwap),
  });

  const appFee = calculateAppFee({
    outputAmount: bridgeQuote.outputAmount,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT) {
    bridgeQuote.message = buildMinOutputBridgeTokenMessage(
      crossSwap,
      bridgeQuote.outputAmount,
      appFee
    );
  }
  if (crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT && appFee.feeAmount.gt(0)) {
    bridgeQuote.message = buildExactOutputBridgeTokenMessage(crossSwap, appFee);
  }

  return {
    crossSwap,
    destinationSwapQuote: undefined,
    bridgeQuote,
    originSwapQuote: undefined,
    contracts: {
      depositEntryPoint: originStrategy.getOriginEntryPoints(
        crossSwap.inputToken.chainId
      ).deposit,
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForExactInputB2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  const results = _prepCrossSwapQuotesRetrievalB2A(crossSwap, strategies);

  const strategyFetches = results.map((result) => {
    const sources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(sources);

    const fetchFn = async () => {
      // 1. Get destination swap quote for bridgeable output token -> any token
      const indicativeDestinationSwapQuote =
        await result.destinationStrategy.fetchFn(
          {
            ...result.destinationSwap,
            amount: crossSwap.amount.toString(),
          },
          TradeType.EXACT_INPUT,
          { sources }
        );
      return {
        result,
        sources,
        indicativeDestinationSwapQuote,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(
    strategyFetches,
    strategies.prioritizationMode
  );

  const {
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableOutputToken,
    destinationSwapChainId,
    destinationStrategy,
  } = prioritizedStrategy.result;

  // 2. Get bridge quote for bridgeable input token -> any token with exact input amount.
  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: crossSwap.inputToken,
    outputToken: bridgeableOutputToken,
    exactInputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote: prioritizedStrategy.indicativeDestinationSwapQuote,
      bridgeableOutputToken,
      routerAddress: destinationRouter.address,
      destinationOutputAmount:
        prioritizedStrategy.indicativeDestinationSwapQuote.minAmountOut,
    }),
  });

  if (bridgeQuote.outputAmount.lt(0)) {
    throw new SwapAmountTooLowForBridgeFeesError({
      bridgeAmount: crossSwap.amount.toString(),
      bridgeFee: bridgeQuote.suggestedFees.totalRelayFee.toString(),
    });
  }

  // 3. Get destination swap quote with correct amount
  const destinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: bridgeQuote.outputAmount.toString(),
    },
    TradeType.EXACT_INPUT,
    { sources: prioritizedStrategy.sources }
  );

  // 4. Build bridge quote message for destination swap
  const appFee = calculateAppFee({
    outputAmount: destinationSwapQuote.minAmountOut,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap,
    destinationSwapQuote,
    bridgeableOutputToken,
    routerAddress: destinationRouter.address,
    destinationOutputAmount: destinationSwapQuote.minAmountOut,
    appFee,
  });

  return {
    crossSwap,
    bridgeQuote,
    destinationSwapQuote,
    originSwapQuote: undefined,
    contracts: {
      originRouter,
      destinationRouter,
      depositEntryPoint,
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForOutputB2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  // Add app fee percentage markup to cross swap amount
  const crossSwapWithAppFee = {
    ...crossSwap,
    amount: crossSwap.appFeePercent
      ? addMarkupToAmount(crossSwap.amount, crossSwap.appFeePercent)
      : crossSwap.amount,
  };
  const results = _prepCrossSwapQuotesRetrievalB2A(
    crossSwapWithAppFee,
    strategies
  );

  const strategyFetches = results.map((result) => {
    const sources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwapWithAppFee.excludeSources,
        includeSources: crossSwapWithAppFee.includeSources,
      }
    );
    assertSources(sources);

    const fetchFn = async () => {
      // 1. Get destination swap quote for bridgeable output token -> any token
      const destinationSwapQuote = await result.destinationStrategy.fetchFn(
        {
          ...result.destinationSwap,
          amount: crossSwapWithAppFee.amount.toString(),
        },
        TradeType.EXACT_OUTPUT,
        { sources }
      );
      return {
        result,
        destinationSwapQuote,
        sources,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(
    strategyFetches,
    strategies.prioritizationMode
  );
  assertMinOutputAmount(
    prioritizedStrategy.destinationSwapQuote.minAmountOut,
    crossSwapWithAppFee.amount,
    {
      actualAmountOut: "destinationSwapQuote.minAmountOut",
      expectedMinAmountOut: "crossSwap.amount",
    }
  );

  const {
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableOutputToken,
    destinationSwapChainId,
  } = prioritizedStrategy.result;

  // 2, Fetch  bridge quote for bridgeable input token -> bridgeable output token based on
  //    destination swap quote.
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: crossSwapWithAppFee.inputToken,
    outputToken: bridgeableOutputToken,
    minOutputAmount: prioritizedStrategy.destinationSwapQuote.maximumAmountIn,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap: crossSwapWithAppFee,
      destinationSwapQuote: prioritizedStrategy.destinationSwapQuote,
      bridgeableOutputToken,
      routerAddress: destinationRouter.address,
      destinationOutputAmount:
        prioritizedStrategy.destinationSwapQuote.minAmountOut,
    }),
  });
  assertMinOutputAmount(
    bridgeQuote.outputAmount,
    prioritizedStrategy.destinationSwapQuote.maximumAmountIn,
    {
      actualAmountOut: "bridgeQuote.outputAmount",
      expectedMinAmountOut:
        "prioritizedStrategy.destinationSwapQuote.maximumAmountIn",
    }
  );

  const appFee = calculateAppFee({
    outputAmount: prioritizedStrategy.destinationSwapQuote.minAmountOut,
    token: crossSwapWithAppFee.outputToken,
    appFeePercent: crossSwapWithAppFee.appFeePercent,
    appFeeRecipient: crossSwapWithAppFee.appFeeRecipient,
    isNative: crossSwapWithAppFee.isOutputNative,
  });
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap: crossSwapWithAppFee,
    destinationSwapQuote: prioritizedStrategy.destinationSwapQuote,
    bridgeableOutputToken,
    routerAddress: destinationRouter.address,
    destinationOutputAmount:
      prioritizedStrategy.destinationSwapQuote.minAmountOut,
    appFee,
  });

  return {
    crossSwap: crossSwapWithAppFee,
    bridgeQuote,
    destinationSwapQuote: prioritizedStrategy.destinationSwapQuote,
    originSwapQuote: undefined,
    contracts: {
      originRouter,
      destinationRouter,
      depositEntryPoint,
    },
    appFee,
  };
}

function _prepCrossSwapQuotesRetrievalB2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): CrossSwapQuotesRetrievalB2AResult[] {
  const originStrategies = getQuoteFetchStrategies(
    crossSwap.inputToken.chainId,
    crossSwap.inputToken.symbol,
    crossSwap.inputToken.symbol,
    strategies
  );
  // Use the first origin strategy since we don't need to fetch multiple origin quotes
  // for B2A swaps.
  const originStrategy = originStrategies.at(0);
  if (!originStrategy) {
    throw new InvalidParamError({
      message: `Failed to fetch swap quote: no origin strategy found for ${crossSwap.inputToken.symbol}`,
    });
  }

  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationSwapChainId = crossSwap.outputToken.chainId;
  const bridgeRoute = getRouteByInputTokenAndDestinationChain(
    crossSwap.inputToken.address,
    destinationSwapChainId
  );

  if (!bridgeRoute) {
    throw new InvalidParamError({
      message:
        `Failed to fetch swap quote: ` +
        `No bridge route found for input token ${crossSwap.inputToken.symbol} ` +
        `${crossSwap.inputToken.chainId} -> ${destinationSwapChainId}`,
    });
  }

  const _bridgeableOutputToken = getTokenByAddress(
    bridgeRoute.toTokenAddress,
    bridgeRoute.toChain
  );

  if (!_bridgeableOutputToken) {
    throw new InvalidParamError({
      message:
        `Failed to fetch swap quote: ` +
        `No bridgeable output token found for ${bridgeRoute.toTokenAddress} ` +
        `on chain ${bridgeRoute.toChain}`,
    });
  }

  const bridgeableOutputToken = {
    address: bridgeRoute.toTokenAddress,
    decimals: _bridgeableOutputToken.decimals,
    symbol: _bridgeableOutputToken.symbol,
    chainId: destinationSwapChainId,
  };

  const destinationSwap = {
    chainId: destinationSwapChainId,
    tokenIn: bridgeableOutputToken,
    tokenOut: crossSwap.outputToken,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    slippageTolerance: crossSwap.slippageTolerance,
    type: crossSwap.type,
  };
  const destinationStrategies = getQuoteFetchStrategies(
    destinationSwap.chainId,
    destinationSwap.tokenIn.symbol,
    destinationSwap.tokenOut.symbol,
    strategies
  );

  return destinationStrategies.map((destinationStrategy) => {
    const originRouter = originStrategy.getRouter(originSwapChainId);
    const destinationRouter = destinationStrategy.getRouter(
      destinationSwapChainId
    );
    const depositEntryPoint =
      originStrategy.getOriginEntryPoints(originSwapChainId).deposit;

    return {
      destinationSwap,
      originRouter,
      destinationRouter,
      depositEntryPoint,
      bridgeableOutputToken,
      destinationSwapChainId,
      destinationStrategy,
      originStrategy,
    };
  });
}

export async function getCrossSwapQuotesForExactInputA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
) {
  const results = _prepCrossSwapQuotesRetrievalA2B(crossSwap, strategies);

  const strategyFetches = results.map((result) => {
    const sources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(sources);

    const fetchFn = async () => {
      // 1. Get origin swap quote for any input token -> bridgeable output token
      const originSwapQuote = await result.originStrategy.fetchFn(
        {
          ...result.originSwap,
          amount: crossSwap.amount.toString(),
        },
        TradeType.EXACT_INPUT,
        { sources }
      );
      return {
        result,
        originSwapQuote,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(
    strategyFetches,
    strategies.prioritizationMode
  );

  const {
    originStrategy,
    originSwapChainId,
    destinationChainId,
    bridgeableInputToken,
    originSwapEntryPoint,
  } = prioritizedStrategy.result;

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: bridgeableInputToken,
    outputToken: crossSwap.outputToken,
    exactInputAmount: prioritizedStrategy.originSwapQuote.minAmountOut,
    recipient: getMultiCallHandlerAddress(destinationChainId),
    message: buildExactInputBridgeTokenMessage(
      crossSwap,
      prioritizedStrategy.originSwapQuote.minAmountOut
    ),
  });

  if (bridgeQuote.outputAmount.lt(0)) {
    throw new SwapAmountTooLowForBridgeFeesError({
      bridgeAmount: prioritizedStrategy.originSwapQuote.minAmountOut.toString(),
      bridgeFee: bridgeQuote.suggestedFees.totalRelayFee.toString(),
    });
  }

  const appFee = calculateAppFee({
    outputAmount: bridgeQuote.outputAmount,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isInputNative,
  });
  bridgeQuote.message = buildExactInputBridgeTokenMessage(
    crossSwap,
    bridgeQuote.outputAmount,
    appFee
  );

  return {
    crossSwap,
    bridgeQuote,
    destinationSwapQuote: undefined,
    originSwapQuote: prioritizedStrategy.originSwapQuote,
    contracts: {
      originSwapEntryPoint,
      depositEntryPoint:
        originStrategy.getOriginEntryPoints(originSwapChainId).deposit,
      originRouter: originStrategy.getRouter(originSwapChainId),
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForOutputA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
) {
  const crossSwapWithAppFee = {
    ...crossSwap,
    amount: crossSwap.appFeePercent
      ? addMarkupToAmount(crossSwap.amount, crossSwap.appFeePercent)
      : crossSwap.amount,
  };
  const results = _prepCrossSwapQuotesRetrievalA2B(
    crossSwapWithAppFee,
    strategies
  );

  if (results.length === 0) {
    throw new InvalidParamError({
      message: `Failed to fetch swap quote: no strategies available for ${
        crossSwapWithAppFee.inputToken.symbol
      } -> ${crossSwapWithAppFee.outputToken.symbol} on chain ${crossSwapWithAppFee.inputToken.chainId}`,
    });
  }

  const { originSwapChainId, destinationChainId, bridgeableInputToken } =
    results[0];

  // 1. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: bridgeableInputToken,
    outputToken: crossSwapWithAppFee.outputToken,
    minOutputAmount: crossSwapWithAppFee.amount,
    recipient: getMultiCallHandlerAddress(destinationChainId),
    message: buildExactOutputBridgeTokenMessage(crossSwapWithAppFee),
  });

  const strategyFetches = results.map((result) => {
    const sources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwapWithAppFee.excludeSources,
        includeSources: crossSwapWithAppFee.includeSources,
      }
    );
    assertSources(sources);

    const fetchFn = async () => {
      const originSwapQuote = await result.originStrategy.fetchFn(
        {
          ...result.originSwap,
          depositor: crossSwapWithAppFee.depositor,
          amount: addMarkupToAmount(
            bridgeQuote.inputAmount,
            QUOTE_BUFFER
          ).toString(),
        },
        TradeType.EXACT_OUTPUT,
        { sources }
      );

      return {
        result,
        originSwapQuote,
        sources,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(
    strategyFetches,
    strategies.prioritizationMode
  );

  // Update bridge quote message
  const appFee = calculateAppFee({
    outputAmount: bridgeQuote.outputAmount,
    token: crossSwapWithAppFee.outputToken,
    appFeePercent: crossSwapWithAppFee.appFeePercent,
    appFeeRecipient: crossSwapWithAppFee.appFeeRecipient,
    isNative: crossSwapWithAppFee.isOutputNative,
  });
  if (
    crossSwapWithAppFee.type === AMOUNT_TYPE.MIN_OUTPUT &&
    (crossSwapWithAppFee.isOutputNative || appFee.feeAmount.gt(0))
  ) {
    bridgeQuote.message = buildMinOutputBridgeTokenMessage(
      crossSwapWithAppFee,
      bridgeQuote.outputAmount,
      appFee
    );
  }
  if (
    crossSwapWithAppFee.type === AMOUNT_TYPE.EXACT_OUTPUT &&
    appFee.feeAmount.gt(0)
  ) {
    bridgeQuote.message = buildExactOutputBridgeTokenMessage(
      crossSwapWithAppFee,
      appFee
    );
  }

  return {
    crossSwap: crossSwapWithAppFee,
    bridgeQuote,
    destinationSwapQuote: undefined,
    originSwapQuote: prioritizedStrategy.originSwapQuote,
    contracts: {
      originSwapEntryPoint: prioritizedStrategy.result.originSwapEntryPoint,
      depositEntryPoint:
        prioritizedStrategy.result.originStrategy.getOriginEntryPoints(
          originSwapChainId
        ).deposit,
      originRouter:
        prioritizedStrategy.result.originStrategy.getRouter(originSwapChainId),
    },
    appFee,
  };
}

function _prepCrossSwapQuotesRetrievalA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): CrossSwapQuotesRetrievalA2BResult[] {
  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationChainId = crossSwap.outputToken.chainId;
  const bridgeRoute = getRouteByOutputTokenAndOriginChain(
    crossSwap.outputToken.address,
    originSwapChainId
  );

  if (!bridgeRoute) {
    throw new Error(
      `No bridge route found for output token ${crossSwap.outputToken.symbol} ` +
        `${originSwapChainId} -> ${crossSwap.outputToken.chainId}`
    );
  }

  const _bridgeableInputToken = getTokenByAddress(
    bridgeRoute.fromTokenAddress,
    bridgeRoute.fromChain
  );

  if (!_bridgeableInputToken) {
    throw new Error(
      `No bridgeable input token found for ${bridgeRoute.toTokenAddress} on chain ${bridgeRoute.toChain}`
    );
  }

  const bridgeableInputToken = {
    address: bridgeRoute.fromTokenAddress,
    decimals: _bridgeableInputToken.decimals,
    symbol: _bridgeableInputToken.symbol,
    chainId: bridgeRoute.fromChain,
  };

  const originStrategies = getQuoteFetchStrategies(
    originSwapChainId,
    crossSwap.inputToken.symbol,
    bridgeableInputToken.symbol,
    strategies
  );

  // Return a list of results for each origin strategy
  return originStrategies.map((originStrategy) => {
    const { swapAndBridge, originSwapInitialRecipient } =
      originStrategy.getOriginEntryPoints(originSwapChainId);
    const originSwap = {
      chainId: originSwapChainId,
      tokenIn: crossSwap.inputToken,
      tokenOut: bridgeableInputToken,
      recipient: originSwapInitialRecipient.address,
      slippageTolerance: crossSwap.slippageTolerance,
      type: crossSwap.type,
    };

    return {
      originSwap,
      originStrategy,
      originSwapChainId,
      destinationChainId,
      bridgeableInputToken,
      originSwapEntryPoint: swapAndBridge,
    };
  });
}

export async function getCrossSwapQuotesA2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
) {
  const preferredBridgeTokens = getPreferredBridgeTokens(
    crossSwap.inputToken.chainId,
    crossSwap.outputToken.chainId
  );
  const bridgeRoutesToCompareChunkSize = 1;
  const fetchQuoteForRoute =
    crossSwap.type === AMOUNT_TYPE.EXACT_INPUT
      ? getCrossSwapQuotesForExactInputByRouteA2A
      : getCrossSwapQuotesForOutputByRouteA2A;

  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationSwapChainId = crossSwap.outputToken.chainId;
  const allBridgeRoutes = getRoutesByChainIds(
    originSwapChainId,
    destinationSwapChainId
  );

  if (allBridgeRoutes.length === 0) {
    throw new InvalidParamError({
      message:
        `Failed to fetch swap quote: ` +
        `No bridge routes found for ${originSwapChainId} -> ${destinationSwapChainId}`,
    });
  }

  const preferredBridgeRoutes = allBridgeRoutes
    .filter(({ toTokenSymbol }) =>
      preferredBridgeTokens.includes(toTokenSymbol)
    )
    .sort((a, b) => {
      const aIndex = preferredBridgeTokens.indexOf(a.toTokenSymbol);
      const bIndex = preferredBridgeTokens.indexOf(b.toTokenSymbol);
      return aIndex - bIndex;
    });
  const bridgeRoutes =
    preferredBridgeRoutes.length > 0 ? preferredBridgeRoutes : allBridgeRoutes;

  let chunkStart = 0;
  const allCrossSwapQuotesFailures: Error[] = [];
  while (chunkStart < bridgeRoutes.length) {
    const bridgeRoutesToCompare = bridgeRoutes.slice(
      chunkStart,
      chunkStart + bridgeRoutesToCompareChunkSize
    );

    if (bridgeRoutesToCompare.length === 0) {
      throw new InvalidParamError({
        message:
          `Failed to fetch swap quote: ` +
          `No bridge routes to compare for ${originSwapChainId} -> ${destinationSwapChainId}`,
      });
    }

    const crossSwapQuotesResults = await Promise.allSettled(
      bridgeRoutesToCompare.map((bridgeRoute) =>
        fetchQuoteForRoute(crossSwap, bridgeRoute, strategies)
      )
    );

    const crossSwapQuotesFailures = crossSwapQuotesResults
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);
    allCrossSwapQuotesFailures.push(...crossSwapQuotesFailures);

    const crossSwapQuotes = crossSwapQuotesResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    if (crossSwapQuotes.length === 0) {
      chunkStart += bridgeRoutesToCompareChunkSize;
      continue;
    }

    // Compare quotes by lowest input amount or max. output amount
    const bestCrossSwapQuote = crossSwapQuotes.reduce((prev, curr) =>
      crossSwap.type === AMOUNT_TYPE.EXACT_INPUT
        ? prev.destinationSwapQuote!.minAmountOut.lt(
            curr.destinationSwapQuote!.minAmountOut
          )
          ? curr
          : prev
        : prev.originSwapQuote!.maximumAmountIn.lt(
              curr.originSwapQuote!.maximumAmountIn
            )
          ? prev
          : curr
    );
    return bestCrossSwapQuote;
  }

  const rejectedReasons = getRejectedReasons(allCrossSwapQuotesFailures);
  logger.debug({
    at: "getCrossSwapQuotesA2A",
    message: "All bridge routes and providers failed",
    failedReasons: rejectedReasons,
  });
  throw new SwapQuoteUnavailableError(
    {
      message: `No swap quotes currently available ${
        crossSwap.inputToken.symbol
      } ${crossSwap.inputToken.chainId} -> ${
        crossSwap.outputToken.symbol
      } ${crossSwap.outputToken.chainId}`,
    },
    {
      cause: rejectedReasons.join(","),
    }
  );
}

export async function getCrossSwapQuotesForExactInputByRouteA2A(
  crossSwap: CrossSwap,
  bridgeRoute: {
    fromTokenAddress: string;
    fromChain: number;
    toTokenAddress: string;
    toChain: number;
  },
  strategies: QuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  const results = _prepCrossSwapQuotesRetrievalA2A(
    crossSwap,
    bridgeRoute,
    strategies,
    "origin"
  );

  const originStrategyFetches = results.map((result) => {
    const originSources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(originSources);

    const destinationSources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(destinationSources);

    const fetchFn = async () => {
      // 1. Get origin swap quote for any input token -> bridgeable input token
      const originSwapQuote = await result.originStrategy.fetchFn(
        {
          ...result.originSwap,
          depositor: crossSwap.depositor,
          amount: crossSwap.amount.toString(),
        },
        TradeType.EXACT_INPUT,
        { sources: originSources }
      );

      // 2. Get INDICATIVE destination swap quote for bridgeable output token -> any token
      //    with exact input amount set to `originSwapQuote.minAmountOut`.
      const indicativeDestinationSwapQuote =
        await result.destinationStrategy.fetchFn(
          {
            ...result.destinationSwap,
            amount: originSwapQuote.minAmountOut.toString(),
          },
          TradeType.EXACT_INPUT,
          { sources: destinationSources }
        );
      return {
        result,
        originSwapQuote,
        originSources,
        indicativeDestinationSwapQuote,
        destinationSources,
      };
    };

    return fetchFn;
  });

  // Run fetchFn for all origin strategies and choose the fastest response
  const prioritizedOriginStrategy = await executeStrategies(
    originStrategyFetches,
    strategies.prioritizationMode
  );

  const {
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableInputToken,
    bridgeableOutputToken,
    destinationSwapChainId,
    originSwapEntryPoint,
    destinationStrategy,
  } = prioritizedOriginStrategy.result;

  // 3. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: bridgeableInputToken,
    outputToken: bridgeableOutputToken,
    exactInputAmount: prioritizedOriginStrategy.originSwapQuote.minAmountOut,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote:
        prioritizedOriginStrategy.indicativeDestinationSwapQuote,
      bridgeableOutputToken,
      routerAddress: destinationRouter.address,
      destinationOutputAmount:
        prioritizedOriginStrategy.indicativeDestinationSwapQuote.minAmountOut,
    }),
  });
  if (bridgeQuote.outputAmount.lt(0)) {
    throw new SwapAmountTooLowForBridgeFeesError({
      bridgeAmount:
        prioritizedOriginStrategy.originSwapQuote.minAmountOut.toString(),
      bridgeFee: bridgeQuote.suggestedFees.totalRelayFee.toString(),
    });
  }

  // 4. Get destination swap quote for bridgeable output token -> any token
  const destinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: addMarkupToAmount(
        bridgeQuote.outputAmount,
        QUOTE_BUFFER + crossSwap.slippageTolerance / 100
      ).toString(),
    },
    TradeType.EXACT_INPUT,
    {
      sources: prioritizedOriginStrategy.destinationSources,
      sellEntireBalance: true,
    }
  );

  // 5. Build bridge quote message for destination swap
  const appFee = calculateAppFee({
    outputAmount: destinationSwapQuote.minAmountOut,
    token: crossSwap.outputToken,
    appFeePercent: crossSwap.appFeePercent,
    appFeeRecipient: crossSwap.appFeeRecipient,
    isNative: crossSwap.isOutputNative,
  });
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap,
    destinationSwapQuote,
    bridgeableOutputToken,
    routerAddress: destinationRouter.address,
    destinationOutputAmount: destinationSwapQuote.minAmountOut,
    appFee,
  });

  return {
    crossSwap,
    destinationSwapQuote,
    bridgeQuote,
    originSwapQuote: prioritizedOriginStrategy.originSwapQuote,
    contracts: {
      originSwapEntryPoint,
      depositEntryPoint,
      originRouter: originRouter,
      destinationRouter: destinationRouter,
    },
    appFee,
  };
}

export async function getCrossSwapQuotesForOutputByRouteA2A(
  crossSwap: CrossSwap,
  bridgeRoute: {
    fromTokenAddress: string;
    fromChain: number;
    toTokenAddress: string;
    toChain: number;
  },
  strategies: QuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  // Add app fee percentage markup to cross swap amount
  const crossSwapWithAppFee = {
    ...crossSwap,
    amount: crossSwap.appFeePercent
      ? addMarkupToAmount(crossSwap.amount, crossSwap.appFeePercent)
      : crossSwap.amount,
  };
  const results = _prepCrossSwapQuotesRetrievalA2A(
    crossSwapWithAppFee,
    bridgeRoute,
    strategies,
    "destination"
  );

  const destinationStrategyFetches = results.map((result) => {
    const destinationSources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwapWithAppFee.excludeSources,
        includeSources: crossSwapWithAppFee.includeSources,
      }
    );
    assertSources(destinationSources);

    const fetchFn = async () => {
      // 1. Get destination swap quote for bridgeable output token -> any token
      const destinationSwapQuote = await result.destinationStrategy.fetchFn(
        {
          ...result.destinationSwap,
          amount: crossSwapWithAppFee.amount.toString(),
        },
        TradeType.EXACT_OUTPUT,
        {
          sources: destinationSources,
        }
      );
      assertMinOutputAmount(
        destinationSwapQuote.minAmountOut,
        crossSwapWithAppFee.amount,
        {
          actualAmountOut: "destinationSwapQuote.minAmountOut",
          expectedMinAmountOut: "crossSwapWithAppFee.amount",
        }
      );

      return {
        result,
        destinationSwapQuote,
        destinationSources,
      };
    };

    return fetchFn;
  });

  // Run destination swap quote fetches for all strategy combinations and choose the fastest
  const prioritizedDestinationStrategy = await executeStrategies(
    destinationStrategyFetches,
    strategies.prioritizationMode
  );
  const { result, destinationSwapQuote, destinationSources } =
    prioritizedDestinationStrategy;
  const {
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableInputToken,
    bridgeableOutputToken,
    destinationSwapChainId,
    originSwapEntryPoint,
    originSwap,
    originStrategy,
    originSwapChainId,
    destinationSwap,
    destinationStrategy,
  } = result;

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: bridgeableInputToken,
    outputToken: bridgeableOutputToken,
    minOutputAmount: destinationSwapQuote.maximumAmountIn,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap: crossSwapWithAppFee,
      destinationSwapQuote,
      bridgeableOutputToken,
      routerAddress: destinationRouter.address,
      destinationOutputAmount: destinationSwapQuote.minAmountOut,
    }),
  });
  assertMinOutputAmount(
    bridgeQuote.outputAmount,
    destinationSwapQuote.maximumAmountIn,
    {
      actualAmountOut: "bridgeQuote.outputAmount",
      expectedMinAmountOut: "destinationSwapQuote.maximumAmountIn",
    }
  );

  const originSources = originStrategy.getSources(originSwapChainId, {
    excludeSources: crossSwapWithAppFee.excludeSources,
    includeSources: crossSwapWithAppFee.includeSources,
  });
  assertSources(originSources);

  const [finalDestinationSwapQuote, originSwapQuote] = await Promise.all([
    // 3.1. Get destination swap quote for bridgeable output token -> any token
    destinationStrategy.fetchFn(
      {
        ...destinationSwap,
        amount: addMarkupToAmount(
          bridgeQuote.outputAmount,
          QUOTE_BUFFER + crossSwapWithAppFee.slippageTolerance / 100
        ).toString(),
      },
      TradeType.EXACT_INPUT,
      {
        sources: destinationSources,
        sellEntireBalance: true,
      }
    ),
    // 3.2. Get origin swap quote for any input token -> bridgeable input token
    originStrategy.fetchFn(
      {
        ...originSwap,
        depositor: crossSwapWithAppFee.depositor,
        amount: addMarkupToAmount(
          bridgeQuote.inputAmount,
          QUOTE_BUFFER
        ).toString(),
      },
      TradeType.EXACT_OUTPUT,
      {
        sources: originSources,
      }
    ),
  ]);
  const appFee = calculateAppFee({
    outputAmount: finalDestinationSwapQuote.minAmountOut,
    token: crossSwapWithAppFee.outputToken,
    appFeePercent: crossSwapWithAppFee.appFeePercent,
    appFeeRecipient: crossSwapWithAppFee.appFeeRecipient,
    isNative: crossSwapWithAppFee.isOutputNative,
  });
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap: crossSwapWithAppFee,
    destinationSwapQuote: finalDestinationSwapQuote,
    bridgeableOutputToken,
    routerAddress: destinationRouter.address,
    destinationOutputAmount: finalDestinationSwapQuote.minAmountOut,
    appFee,
  });
  assertMinOutputAmount(
    finalDestinationSwapQuote.minAmountOut,
    crossSwapWithAppFee.amount,
    {
      actualAmountOut: "finalDestinationSwapQuote.minAmountOut",
      expectedMinAmountOut: "crossSwapWithAppFee.amount",
    }
  );
  assertMinOutputAmount(originSwapQuote.minAmountOut, bridgeQuote.inputAmount, {
    actualAmountOut: "originSwapQuote.minAmountOut",
    expectedMinAmountOut: "bridgeQuote.inputAmount",
  });

  return {
    crossSwap: crossSwapWithAppFee,
    destinationSwapQuote: finalDestinationSwapQuote,
    bridgeQuote,
    originSwapQuote,
    contracts: {
      originSwapEntryPoint,
      depositEntryPoint,
      originRouter: originRouter,
      destinationRouter: destinationRouter,
    },
    appFee,
  };
}

function _prepCrossSwapQuotesRetrievalA2A(
  crossSwap: CrossSwap,
  bridgeRoute: {
    fromTokenAddress: string;
    fromChain: number;
    toTokenAddress: string;
    toChain: number;
  },
  strategies: QuoteFetchStrategies,
  strategiesToUseForComparison: "origin" | "destination" = "origin"
): CrossSwapQuotesRetrievalA2AResult {
  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationSwapChainId = crossSwap.outputToken.chainId;

  const _bridgeableInputToken = getTokenByAddress(
    bridgeRoute.fromTokenAddress,
    bridgeRoute.fromChain
  );
  const _bridgeableOutputToken = getTokenByAddress(
    bridgeRoute.toTokenAddress,
    bridgeRoute.toChain
  );

  if (!_bridgeableInputToken) {
    throw new Error(
      `No bridgeable input token found for ${bridgeRoute.fromTokenAddress} on chain ${bridgeRoute.fromChain}`
    );
  }

  if (!_bridgeableOutputToken) {
    throw new Error(
      `No bridgeable output token found for ${bridgeRoute.toTokenAddress} on chain ${bridgeRoute.toChain}`
    );
  }

  const bridgeableInputToken = {
    address: bridgeRoute.fromTokenAddress,
    decimals: _bridgeableInputToken.decimals,
    symbol: _bridgeableInputToken.symbol,
    chainId: bridgeRoute.fromChain,
  };
  const bridgeableOutputToken = {
    address: bridgeRoute.toTokenAddress,
    decimals: _bridgeableOutputToken.decimals,
    symbol: _bridgeableOutputToken.symbol,
    chainId: bridgeRoute.toChain,
  };

  const originStrategies = getQuoteFetchStrategies(
    originSwapChainId,
    crossSwap.inputToken.symbol,
    bridgeableInputToken.symbol,
    strategies
  );
  const destinationStrategies = getQuoteFetchStrategies(
    destinationSwapChainId,
    bridgeableOutputToken.symbol,
    crossSwap.outputToken.symbol,
    strategies
  );

  const baseStrategies =
    strategiesToUseForComparison === "origin"
      ? originStrategies
      : destinationStrategies;

  return baseStrategies.map((strategy) => {
    const originStrategy =
      strategiesToUseForComparison === "origin"
        ? strategy
        : (originStrategies.find(
            (originStrategy) =>
              originStrategy.strategyName === strategy.strategyName
          ) ?? originStrategies[0]);
    const destinationStrategy =
      strategiesToUseForComparison === "destination"
        ? strategy
        : (destinationStrategies.find(
            (destinationStrategy) =>
              destinationStrategy.strategyName === strategy.strategyName
          ) ?? destinationStrategies[0]);

    const { swapAndBridge, originSwapInitialRecipient } =
      originStrategy.getOriginEntryPoints(originSwapChainId);
    const depositEntryPoint =
      originStrategy.getOriginEntryPoints(originSwapChainId).deposit;
    const originRouter = originStrategy.getRouter(originSwapChainId);
    const multiCallHandlerAddress = getMultiCallHandlerAddress(
      destinationSwapChainId
    );
    const destinationRouter = destinationStrategy.getRouter(
      destinationSwapChainId
    );

    const originSwap = {
      chainId: originSwapChainId,
      tokenIn: crossSwap.inputToken,
      tokenOut: bridgeableInputToken,
      recipient: originSwapInitialRecipient.address,
      slippageTolerance: crossSwap.slippageTolerance,
      type: crossSwap.type,
    };
    const destinationSwap = {
      chainId: destinationSwapChainId,
      tokenIn: bridgeableOutputToken,
      tokenOut: crossSwap.outputToken,
      recipient: multiCallHandlerAddress,
      slippageTolerance: crossSwap.slippageTolerance,
      type: crossSwap.type,
    };

    return {
      originSwap,
      destinationSwap,
      originStrategy,
      destinationStrategy,
      originSwapChainId,
      destinationSwapChainId,
      originSwapEntryPoint: swapAndBridge,
      depositEntryPoint,
      bridgeableInputToken,
      bridgeableOutputToken,
      originRouter,
      destinationRouter,
    };
  });
}

/**
 * Executes multiple strategy fetches based on configured prioritization mode.
 * @param strategyFetches - The strategy fetches to execute.
 * @param prioritizationMode - The prioritization mode to use.
 * - `equal-speed` - Executes all strategy fetches in parallel and returns the first
 *                   one that completes.
 * - `priority-speed` - Executes the first `priorityChunkSize` strategy fetches in
 *                      parallel and returns the first one that completes. If all
 *                      of the first `priorityChunkSize` strategy fetches fail,
 *                      the remaining strategy fetches are executed in parallel
 *                      and the first one that completes is returned.
 * @returns The prioritized strategy fetch.
 */
export async function executeStrategies<T>(
  strategyFetches: (() => Promise<T>)[],
  prioritizationMode: QuoteFetchPrioritizationMode = {
    mode: "equal-speed",
  }
): Promise<T> {
  try {
    // `equal-speed` mode
    if (prioritizationMode.mode === "equal-speed") {
      return await Promise.any(strategyFetches.map((fetch) => fetch()));
    }

    // `priority-speed` mode
    const errors: Error[] = [];
    let chunkStartIndex = 0;
    const priorityChunkSize = prioritizationMode.priorityChunkSize;
    while (chunkStartIndex < strategyFetches.length) {
      const chunkEndIndex = chunkStartIndex + priorityChunkSize;
      const priorityFetches = strategyFetches.slice(
        chunkStartIndex,
        chunkEndIndex
      );
      try {
        const successfulFetch = await Promise.any(
          priorityFetches.map((fetch) => fetch())
        );
        return successfulFetch;
      } catch (error) {
        if (error instanceof AggregateError) {
          errors.push(...error.errors);
        } else {
          errors.push(error as Error);
        }
        chunkStartIndex = chunkEndIndex;
      }
    }
    throw new AggregateError(errors);
  } catch (error) {
    // If all quote fetches errored, we need to determine which error to propagate to the
    // caller.
    if (error instanceof AggregateError) {
      const errors = error.errors;
      const swapQuoteUnavailableError = errors.find(
        (error) => error instanceof SwapQuoteUnavailableError
      );

      // If all quote fetches errored and at least one of them errored with a
      // SwapQuoteUnavailableError, throw the error.
      if (swapQuoteUnavailableError) {
        throw new SwapQuoteUnavailableError(
          {
            message: "No available quotes for specified transfer",
          },
          {
            cause: swapQuoteUnavailableError,
          }
        );
      }
      // If all quote fetches errored with an InvalidParamError, throw the first one.
      if (
        errors.every(
          (error) =>
            error instanceof InvalidParamError &&
            (error.param === "excludeSources" ||
              error.param === "includeSources")
        )
      ) {
        throw new InvalidParamError({
          message: "No available quotes for specified sources",
        });
      }
    }
    throw error;
  }
}

function assertSources(sources: QuoteFetchOpts["sources"]) {
  if (!sources || sources.sourcesKeys.length > 0) {
    return;
  }

  throw new InvalidParamError({
    param:
      sources.sourcesType === "exclude" ? "excludeSources" : "includeSources",
    message:
      "None of the provided sources are valid. Call the endpoint /swap/sources to get a list of valid sources.",
  });
}

/**
 * Executes quotes for multiple cross swap types and selects the best one.
 * For exact input, compare based on destination swap output amount if available, otherwise bridge output amount.
 * For exact output, compare based on destination swap input amount if available, otherwise bridge input amount.
 */
async function selectBestCrossSwapQuote(
  crossSwapQuotePromises: Promise<CrossSwapQuotes>[],
  crossSwap: CrossSwap
): Promise<CrossSwapQuotes> {
  const crossSwapQuotePromisesWithTimeout = crossSwapQuotePromises.map(
    (promise) => addTimeoutToPromise(promise, PROMISE_TIMEOUT_MS)
  );
  const crossSwapQuotes = await Promise.allSettled(
    crossSwapQuotePromisesWithTimeout
  );

  const fulfilledQuotes = crossSwapQuotes
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  if (fulfilledQuotes.length === 0) {
    const rejectedQuotes = crossSwapQuotes.filter(
      (result) => result.status === "rejected"
    );

    // If there is only one rejected quote and it is a SwapQuoteUnavailableError, throw it.
    if (
      rejectedQuotes.length === 1 &&
      rejectedQuotes[0].reason instanceof SwapQuoteUnavailableError
    ) {
      throw rejectedQuotes[0].reason;
    }

    const rejectedReasons = getRejectedReasons(crossSwapQuotes);
    const message = `No swap quotes currently available ${
      crossSwap.inputToken.symbol
    } ${crossSwap.inputToken.chainId} -> ${
      crossSwap.outputToken.symbol
    } ${crossSwap.outputToken.chainId}`;
    throw new SwapQuoteUnavailableError(
      {
        message,
      },
      {
        cause:
          rejectedReasons.length > 0 ? rejectedReasons.join(", ") : undefined,
      }
    );
  }

  if (fulfilledQuotes.length === 1) {
    return fulfilledQuotes[0];
  }

  const bestQuote = fulfilledQuotes.reduce((best, current) => {
    const currentDestinationSwapQuote = current.destinationSwapQuote;
    const bestDestinationSwapQuote = best.destinationSwapQuote;
    const currentBridgeQuote = current.bridgeQuote;
    const bestBridgeQuote = best.bridgeQuote;
    const isExactInput = crossSwap.type === "exactInput";

    const currentAmount = currentDestinationSwapQuote
      ? isExactInput
        ? currentDestinationSwapQuote.expectedAmountOut
        : currentDestinationSwapQuote.expectedAmountIn
      : isExactInput
        ? currentBridgeQuote.outputAmount
        : currentBridgeQuote.inputAmount;
    const bestAmount = bestDestinationSwapQuote
      ? isExactInput
        ? bestDestinationSwapQuote.expectedAmountOut
        : bestDestinationSwapQuote.expectedAmountIn
      : isExactInput
        ? bestBridgeQuote.outputAmount
        : bestBridgeQuote.inputAmount;

    return isExactInput
      ? currentAmount.gt(bestAmount)
        ? current
        : best
      : currentAmount.lt(bestAmount)
        ? current
        : best;
  });

  return bestQuote;
}
