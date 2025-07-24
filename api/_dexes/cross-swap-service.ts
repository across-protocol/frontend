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
} from "../_utils";
import { CrossSwap, CrossSwapQuotes, QuoteFetchOpts } from "./types";
import {
  buildExactInputBridgeTokenMessage,
  buildExactOutputBridgeTokenMessage,
  buildMinOutputBridgeTokenMessage,
  getCrossSwapTypes,
  getPreferredBridgeTokens,
  getQuoteFetchStrategies,
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

const PROMISE_TIMEOUT_MS = 15_000;

const logger = getLogger();

export async function getCrossSwapQuotes(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies = {
    default: defaultQuoteFetchStrategies,
  }
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

  bridgeQuote.message = buildExactInputBridgeTokenMessage(
    crossSwap,
    bridgeQuote.outputAmount
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

  if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT) {
    bridgeQuote.message = buildMinOutputBridgeTokenMessage(
      crossSwap,
      bridgeQuote.outputAmount
    );
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
  };
}

export async function getCrossSwapQuotesForExactInputB2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  const results = _prepCrossSwapQuotesRetrievalB2A(crossSwap, strategies);

  const strategyFetches = results.map(async (result) => {
    const sources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(sources);

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
      indicativeDestinationSwapQuote,
    };
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(strategyFetches);

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
    }),
  });

  if (bridgeQuote.outputAmount.lt(0)) {
    throw new SwapAmountTooLowForBridgeFeesError({
      bridgeAmount: crossSwap.amount.toString(),
      bridgeFee: bridgeQuote.suggestedFees.totalRelayFee.toString(),
    });
  }

  // 3. Get destination swap quote with correct amount
  const sources = destinationStrategy.getSources(destinationSwap.chainId, {
    excludeSources: crossSwap.excludeSources,
    includeSources: crossSwap.includeSources,
  });
  assertSources(sources);

  const destinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: bridgeQuote.outputAmount.toString(),
    },
    TradeType.EXACT_INPUT,
    { sources }
  );

  // 4. Build bridge quote message for destination swap
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap,
    destinationSwapQuote,
    bridgeableOutputToken,
    routerAddress: destinationRouter.address,
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
  };
}

export async function getCrossSwapQuotesForOutputB2A(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
): Promise<CrossSwapQuotes> {
  const results = _prepCrossSwapQuotesRetrievalB2A(crossSwap, strategies);

  const strategyFetches = results.map(async (result) => {
    const sources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(sources);

    const indicativeDestinationSwapQuote =
      await result.destinationStrategy.fetchFn(
        {
          ...result.destinationSwap,
          amount: crossSwap.amount.toString(),
        },
        TradeType.EXACT_OUTPUT,
        { sources }
      );
    return {
      result,
      indicativeDestinationSwapQuote,
      sources,
    };
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(strategyFetches);

  const {
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableOutputToken,
    destinationSwapChainId,
    destinationStrategy,
  } = prioritizedStrategy.result;

  // 2. Fetch REAL destination swap quote and bridge quote in parallel to improve performance.
  const [destinationSwapQuote, bridgeQuote] = await Promise.all([
    // 2.1. REAL destination swap quote for bridgeable output token -> any token.
    //      Quote contains calldata.
    destinationStrategy.fetchFn(
      {
        ...destinationSwap,
        amount: crossSwap.amount.toString(),
      },
      TradeType.EXACT_OUTPUT,
      { sources: prioritizedStrategy.sources }
    ),
    // 2.2. Bridge quote for bridgeable input token -> bridgeable output token based on
    //      indicative destination swap quote.
    getBridgeQuoteForMinOutput({
      inputToken: crossSwap.inputToken,
      outputToken: bridgeableOutputToken,
      minOutputAmount:
        prioritizedStrategy.indicativeDestinationSwapQuote.maximumAmountIn,
      recipient: getMultiCallHandlerAddress(destinationSwapChainId),
      message: buildDestinationSwapCrossChainMessage({
        crossSwap,
        destinationSwapQuote:
          prioritizedStrategy.indicativeDestinationSwapQuote,
        bridgeableOutputToken,
        routerAddress: destinationRouter.address,
      }),
    }),
  ]);
  assertMinOutputAmount(destinationSwapQuote.minAmountOut, crossSwap.amount);
  assertMinOutputAmount(
    bridgeQuote.outputAmount,
    destinationSwapQuote.maximumAmountIn
  );

  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap,
    destinationSwapQuote,
    bridgeableOutputToken,
    routerAddress: destinationRouter.address,
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

  const strategyFetches = results.map(async (result) => {
    const sources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(sources);

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
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(strategyFetches);

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

  bridgeQuote.message = buildExactInputBridgeTokenMessage(
    crossSwap,
    bridgeQuote.outputAmount
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
  };
}

export async function getCrossSwapQuotesForOutputA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
) {
  const results = _prepCrossSwapQuotesRetrievalA2B(crossSwap, strategies);

  if (results.length === 0) {
    throw new InvalidParamError({
      message: `Failed to fetch swap quote: no strategies available for ${crossSwap.inputToken.symbol} -> ${crossSwap.outputToken.symbol} on chain ${crossSwap.inputToken.chainId}`,
    });
  }

  const { originSwapChainId, destinationChainId, bridgeableInputToken } =
    results[0];

  // 1. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: bridgeableInputToken,
    outputToken: crossSwap.outputToken,
    minOutputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(destinationChainId),
    message: buildExactOutputBridgeTokenMessage(crossSwap),
  });
  // 1.1. Update bridge quote message for min. output amount
  if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT && crossSwap.isOutputNative) {
    bridgeQuote.message = buildMinOutputBridgeTokenMessage(
      crossSwap,
      bridgeQuote.outputAmount
    );
  }

  const strategyFetches = results.map(async (result) => {
    const sources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(sources);

    const originSwapQuote = await result.originStrategy.fetchFn(
      {
        ...result.originSwap,
        depositor: crossSwap.depositor,
        amount: bridgeQuote.inputAmount.toString(),
      },
      TradeType.EXACT_OUTPUT,
      { sources }
    );
    return {
      result,
      originSwapQuote,
      sources,
    };
  });

  // Run fetchFn for all strategy combinations and choose the fastest response
  const prioritizedStrategy = await executeStrategies(strategyFetches);

  return {
    crossSwap,
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
  const bridgeRoutesToCompareChunkSize = 2;
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

  const preferredBridgeRoutes = allBridgeRoutes.filter(({ toTokenSymbol }) =>
    preferredBridgeTokens.includes(toTokenSymbol)
  );
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

  const originStrategyFetches = results.map(async (result) => {
    const originSources = result.originStrategy.getSources(
      result.originSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(originSources);

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
    return {
      result,
      originSwapQuote,
      originSources,
    };
  });

  // Run fetchFn for all origin strategies and choose the fastest response
  const prioritizedOriginStrategy = await executeStrategies(
    originStrategyFetches
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

  const destinationSources = destinationStrategy.getSources(
    destinationSwap.chainId,
    {
      excludeSources: crossSwap.excludeSources,
      includeSources: crossSwap.includeSources,
    }
  );
  assertSources(destinationSources);

  // 2. Get INDICATIVE destination swap quote for bridgeable output token -> any token
  //    with exact input amount set to `originSwapQuote.minAmountOut`.
  const indicativeDestinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: prioritizedOriginStrategy.originSwapQuote.minAmountOut.toString(),
    },
    TradeType.EXACT_INPUT,
    { sources: prioritizedOriginStrategy.originSources }
  );

  // 3. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: bridgeableInputToken,
    outputToken: bridgeableOutputToken,
    exactInputAmount: prioritizedOriginStrategy.originSwapQuote.minAmountOut,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote: indicativeDestinationSwapQuote,
      bridgeableOutputToken,
      routerAddress: destinationRouter.address,
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
      amount: bridgeQuote.outputAmount.toString(),
    },
    TradeType.EXACT_INPUT,
    {
      sources: destinationSources,
    }
  );

  // 5. Build bridge quote message for destination swap
  bridgeQuote.message = buildDestinationSwapCrossChainMessage({
    crossSwap,
    destinationSwapQuote,
    bridgeableOutputToken,
    routerAddress: destinationRouter.address,
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
  const results = _prepCrossSwapQuotesRetrievalA2A(
    crossSwap,
    bridgeRoute,
    strategies,
    "destination"
  );

  const destinationStrategyFetches = results.map(async (result) => {
    const destinationSources = result.destinationStrategy.getSources(
      result.destinationSwap.chainId,
      {
        excludeSources: crossSwap.excludeSources,
        includeSources: crossSwap.includeSources,
      }
    );
    assertSources(destinationSources);

    // 1. Get destination swap quote for bridgeable output token -> any token
    const destinationSwapQuote = await result.destinationStrategy.fetchFn(
      {
        ...result.destinationSwap,
        amount: crossSwap.amount.toString(),
      },
      TradeType.EXACT_OUTPUT,
      {
        sources: destinationSources,
      }
    );
    return {
      result,
      destinationSwapQuote,
      destinationSources,
    };
  });

  // Run destination swap quote fetches for all strategy combinations and choose the fastest
  const prioritizedDestinationStrategy = await executeStrategies(
    destinationStrategyFetches
  );
  const { result, destinationSwapQuote } = prioritizedDestinationStrategy;
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
  } = result;

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: bridgeableInputToken,
    outputToken: bridgeableOutputToken,
    minOutputAmount: destinationSwapQuote.maximumAmountIn,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote,
      bridgeableOutputToken,
      routerAddress: destinationRouter.address,
    }),
  });

  const originSources = originStrategy.getSources(originSwapChainId, {
    excludeSources: crossSwap.excludeSources,
    includeSources: crossSwap.includeSources,
  });
  assertSources(originSources);

  // 3. Get origin swap quote for any input token -> bridgeable input token
  const originSwapQuote = await originStrategy.fetchFn(
    {
      ...originSwap,
      depositor: crossSwap.depositor,
      amount: bridgeQuote.inputAmount.toString(),
    },
    TradeType.EXACT_OUTPUT,
    {
      sources: originSources,
    }
  );
  assertMinOutputAmount(destinationSwapQuote.minAmountOut, crossSwap.amount);
  assertMinOutputAmount(
    bridgeQuote.outputAmount,
    destinationSwapQuote.maximumAmountIn
  );
  assertMinOutputAmount(originSwapQuote.minAmountOut, bridgeQuote.inputAmount);

  return {
    crossSwap,
    destinationSwapQuote,
    bridgeQuote,
    originSwapQuote,
    contracts: {
      originSwapEntryPoint,
      depositEntryPoint,
      originRouter: originRouter,
      destinationRouter: destinationRouter,
    },
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
 * Executes multiple strategy fetches and returns the first one that completes.
 * Currently prioritizes speed by using Promise.any, but can be extended to use
 * other prioritization criteria in the future.
 */
async function executeStrategies<T>(strategyFetches: Promise<T>[]): Promise<T> {
  try {
    return await Promise.any(strategyFetches);
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
