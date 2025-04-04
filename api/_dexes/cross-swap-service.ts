import { TradeType } from "@uniswap/sdk-core";
import { utils } from "ethers";

import {
  getBridgeQuoteForMinOutput,
  getRouteByInputTokenAndDestinationChain,
  getRouteByOutputTokenAndOriginChain,
  getRoutesByChainIds,
  getTokenByAddress,
  Profiler,
  addMarkupToAmount,
  getBridgeQuoteForExactInput,
} from "../_utils";
import { CrossSwap, CrossSwapQuotes } from "./types";
import {
  buildExactInputBridgeTokenMessage,
  buildExactOutputBridgeTokenMessage,
  buildMinOutputBridgeTokenMessage,
  getCrossSwapType,
  getPreferredBridgeTokens,
  getQuoteFetchStrategy,
  NoQuoteFoundError,
  QuoteFetchStrategies,
} from "./utils";
import { getMultiCallHandlerAddress } from "../_multicall-handler";
import {
  defaultQuoteFetchStrategy,
  AMOUNT_TYPE,
  CROSS_SWAP_TYPE,
  buildDestinationSwapCrossChainMessage,
  assertMinOutputAmount,
} from "./utils";
import { AmountTooLowError } from "../_errors";

const indicativeQuoteBuffer = 0.005; // 0.5% buffer for indicative quotes

export async function getCrossSwapQuotes(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies = {
    default: defaultQuoteFetchStrategy,
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

  throw new Error("Invalid amount type");
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
) {
  const crossSwapType = getCrossSwapType({
    inputToken: crossSwap.inputToken.address,
    originChainId: crossSwap.inputToken.chainId,
    outputToken: crossSwap.outputToken.address,
    destinationChainId: crossSwap.outputToken.chainId,
    isInputNative: Boolean(crossSwap.isInputNative),
    isOutputNative: Boolean(crossSwap.isOutputNative),
  });

  const handler = typeToHandler[crossSwapType];
  if (!handler) {
    throw new Error("Invalid cross swap type");
  }

  return handler(crossSwap, strategies);
}

export async function getCrossSwapQuotesForExactInputB2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
) {
  const originStrategy = getQuoteFetchStrategy(
    crossSwap.inputToken.chainId,
    crossSwap.inputToken.symbol,
    crossSwap.inputToken.symbol,
    strategies
  );
  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    exactInputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
    message: buildExactInputBridgeTokenMessage(crossSwap, crossSwap.amount),
  });
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
) {
  const originStrategy = getQuoteFetchStrategy(
    crossSwap.inputToken.chainId,
    crossSwap.inputToken.symbol,
    crossSwap.inputToken.symbol,
    strategies
  );
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
  const {
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableOutputToken,
    destinationSwapChainId,
    destinationStrategy,
  } = _prepCrossSwapQuotesRetrievalB2A(crossSwap, strategies);

  // 1. Get INDICATIVE destination swap quote for bridgeable output token -> any token
  //    with exact input amount set to `crossSwap.amount`.
  const indicativeDestinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: crossSwap.amount.toString(),
    },
    TradeType.EXACT_INPUT
  );

  // 2. Get bridge quote for bridgeable input token -> any token with exact input amount.
  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: crossSwap.inputToken,
    outputToken: bridgeableOutputToken,
    exactInputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote: indicativeDestinationSwapQuote,
      bridgeableOutputToken,
      routerAddress: destinationRouter.address,
    }),
  });

  if (bridgeQuote.outputAmount.lt(0)) {
    throw new AmountTooLowError({
      message:
        `Bridge amount is too low to cover bridge fees: ` +
        `${utils.formatUnits(bridgeQuote.suggestedFees.totalRelayFee.total, crossSwap.inputToken.decimals)}`,
    });
  }

  // 3. Get destination swap quote with correct amount
  const destinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: bridgeQuote.outputAmount.toString(),
    },
    TradeType.EXACT_INPUT
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
  const profiler = new Profiler({
    at: "api/_dexes/cross-swap-service#getCrossSwapQuotesForOutputB2A",
    logger: console,
  });
  const {
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableOutputToken,
    destinationSwapChainId,
    destinationStrategy,
  } = _prepCrossSwapQuotesRetrievalB2A(crossSwap, strategies);

  // 1. Get INDICATIVE destination swap quote for bridgeable output token -> any token
  //    with exact output amount. This request is faster but does not contain calldata.
  const indicativeDestinationSwapQuote = await profiler.measureAsync(
    destinationStrategy.fetchFn(
      {
        ...destinationSwap,
        amount: crossSwap.amount.toString(),
      },
      TradeType.EXACT_OUTPUT,
      {
        useIndicativeQuote: true,
      }
    ),
    "INDICATIVE_getDestinationSwapQuote"
  );

  // 2. Fetch REAL destination swap quote and bridge quote in parallel to improve performance.
  const [destinationSwapQuote, bridgeQuote] = await profiler.measureAsync(
    Promise.all([
      // 2.1. REAL destination swap quote for bridgeable output token -> any token.
      //      Quote contains calldata.
      destinationStrategy.fetchFn(
        {
          ...destinationSwap,
          amount: crossSwap.amount.toString(),
        },
        TradeType.EXACT_OUTPUT
      ),
      // 2.2. Bridge quote for bridgeable input token -> bridgeable output token based on
      //      indicative destination swap quote.
      getBridgeQuoteForMinOutput({
        inputToken: crossSwap.inputToken,
        outputToken: bridgeableOutputToken,
        minOutputAmount: indicativeDestinationSwapQuote.maximumAmountIn,
        recipient: getMultiCallHandlerAddress(destinationSwapChainId),
        message: buildDestinationSwapCrossChainMessage({
          crossSwap,
          destinationSwapQuote: indicativeDestinationSwapQuote,
          bridgeableOutputToken,
          routerAddress: destinationRouter.address,
        }),
      }),
    ]),
    "getAllQuotes"
  );
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
) {
  const originStrategy = getQuoteFetchStrategy(
    crossSwap.inputToken.chainId,
    crossSwap.inputToken.symbol,
    crossSwap.inputToken.symbol,
    strategies
  );
  const originSwapChainId = crossSwap.inputToken.chainId;
  const destinationSwapChainId = crossSwap.outputToken.chainId;
  const bridgeRoute = getRouteByInputTokenAndDestinationChain(
    crossSwap.inputToken.address,
    destinationSwapChainId
  );

  if (!bridgeRoute) {
    throw new Error(
      `No bridge route found for input token ${crossSwap.inputToken.symbol} ` +
        `${crossSwap.inputToken.chainId} -> ${destinationSwapChainId}`
    );
  }

  const _bridgeableOutputToken = getTokenByAddress(
    bridgeRoute.toTokenAddress,
    bridgeRoute.toChain
  );

  if (!_bridgeableOutputToken) {
    throw new Error(
      `No bridgeable output token found for ${bridgeRoute.toTokenAddress} on chain ${bridgeRoute.toChain}`
    );
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
  const destinationStrategy = getQuoteFetchStrategy(
    destinationSwap.chainId,
    destinationSwap.tokenIn.symbol,
    destinationSwap.tokenOut.symbol,
    strategies
  );
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
  };
}

export async function getCrossSwapQuotesForExactInputA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
) {
  const {
    originSwap,
    originStrategy,
    originSwapChainId,
    destinationChainId,
    bridgeableInputToken,
    originSwapEntryPoint,
  } = _prepCrossSwapQuotesRetrievalA2B(crossSwap, strategies);

  // 1. Get origin swap quote for any input token -> bridgeable input token
  const originSwapQuote = await originStrategy.fetchFn(
    {
      ...originSwap,
      amount: crossSwap.amount.toString(),
    },
    TradeType.EXACT_INPUT
  );

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: bridgeableInputToken,
    outputToken: crossSwap.outputToken,
    exactInputAmount: originSwapQuote.minAmountOut,
    recipient: getMultiCallHandlerAddress(destinationChainId),
    message: buildExactInputBridgeTokenMessage(
      crossSwap,
      originSwapQuote.minAmountOut
    ),
  });
  bridgeQuote.message = buildExactInputBridgeTokenMessage(
    crossSwap,
    bridgeQuote.outputAmount
  );

  return {
    crossSwap,
    bridgeQuote,
    destinationSwapQuote: undefined,
    originSwapQuote,
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
  const profiler = new Profiler({
    at: "api/_dexes/cross-swap-service#getCrossSwapQuotesForOutputA2B",
    logger: console,
  });
  const {
    originSwap,
    originStrategy,
    originSwapChainId,
    destinationChainId,
    bridgeableInputToken,
    originSwapEntryPoint,
  } = _prepCrossSwapQuotesRetrievalA2B(crossSwap, strategies);

  // 1. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await profiler.measureAsync(
    getBridgeQuoteForMinOutput({
      inputToken: bridgeableInputToken,
      outputToken: crossSwap.outputToken,
      minOutputAmount: crossSwap.amount,
      recipient: getMultiCallHandlerAddress(destinationChainId),
      message: buildExactOutputBridgeTokenMessage(crossSwap),
    }),
    "getBridgeQuote"
  );
  // 1.1. Update bridge quote message for min. output amount
  if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT && crossSwap.isOutputNative) {
    bridgeQuote.message = buildMinOutputBridgeTokenMessage(
      crossSwap,
      bridgeQuote.outputAmount
    );
  }

  // 2.1. Get origin swap quote for any input token -> bridgeable input token
  const indicativeOriginSwapQuote = await profiler.measureAsync(
    originStrategy.fetchFn(
      {
        ...originSwap,
        depositor: crossSwap.depositor,
        amount: bridgeQuote.inputAmount.toString(),
      },
      TradeType.EXACT_OUTPUT,
      {
        useIndicativeQuote: true,
      }
    ),
    "INDICATIVE_getOriginSwapQuote"
  );
  // 2.2. Re-fetch origin swap quote with updated input amount and EXACT_INPUT type.
  //      This prevents leftover tokens in the SwapAndBridge contract.
  let originSwapQuote = await profiler.measureAsync(
    originStrategy.fetchFn(
      {
        ...originSwap,
        depositor: crossSwap.depositor,
        amount: addMarkupToAmount(
          indicativeOriginSwapQuote.maximumAmountIn,
          indicativeQuoteBuffer
        ).toString(),
      },
      TradeType.EXACT_INPUT
    ),
    "getOriginSwapQuote"
  );
  assertMinOutputAmount(originSwapQuote.minAmountOut, bridgeQuote.inputAmount);

  return {
    crossSwap,
    bridgeQuote,
    destinationSwapQuote: undefined,
    originSwapQuote,
    contracts: {
      originSwapEntryPoint,
      depositEntryPoint:
        originStrategy.getOriginEntryPoints(originSwapChainId).deposit,
      originRouter: originStrategy.getRouter(originSwapChainId),
    },
  };
}

function _prepCrossSwapQuotesRetrievalA2B(
  crossSwap: CrossSwap,
  strategies: QuoteFetchStrategies
) {
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
  const originStrategy = getQuoteFetchStrategy(
    originSwapChainId,
    crossSwap.inputToken.symbol,
    bridgeableInputToken.symbol,
    strategies
  );

  const originSwapEntryPoint =
    originStrategy.getOriginEntryPoints(originSwapChainId).swapAndBridge;
  const originSwap = {
    chainId: originSwapChainId,
    tokenIn: crossSwap.inputToken,
    tokenOut: bridgeableInputToken,
    recipient: originSwapEntryPoint.address,
    slippageTolerance: crossSwap.slippageTolerance,
    type: crossSwap.type,
  };

  return {
    originSwap,
    originStrategy,
    originSwapChainId,
    destinationChainId,
    bridgeableInputToken,
    originSwapEntryPoint,
  };
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
    throw new Error(
      `No bridge routes found for ${originSwapChainId} -> ${destinationSwapChainId}`
    );
  }

  const preferredBridgeRoutes = allBridgeRoutes.filter(({ toTokenSymbol }) =>
    preferredBridgeTokens.includes(toTokenSymbol)
  );
  const bridgeRoutes =
    preferredBridgeRoutes.length > 0 ? preferredBridgeRoutes : allBridgeRoutes;

  let chunkStart = 0;
  while (chunkStart < bridgeRoutes.length) {
    const bridgeRoutesToCompare = bridgeRoutes.slice(
      chunkStart,
      chunkStart + bridgeRoutesToCompareChunkSize
    );

    if (bridgeRoutesToCompare.length === 0) {
      throw new Error(
        `No bridge routes to compare for ${originSwapChainId} -> ${destinationSwapChainId}`
      );
    }

    const crossSwapQuotesResults = await Promise.allSettled(
      bridgeRoutesToCompare.map((bridgeRoute) =>
        fetchQuoteForRoute(crossSwap, bridgeRoute, strategies)
      )
    );

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

  throw new NoQuoteFoundError({
    originSwapChainId,
    inputTokenSymbol: crossSwap.inputToken.symbol,
    destinationSwapChainId,
    outputTokenSymbol: crossSwap.outputToken.symbol,
  });
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
  const {
    originSwap,
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableInputToken,
    bridgeableOutputToken,
    destinationSwapChainId,
    originSwapEntryPoint,
    originStrategy,
    destinationStrategy,
  } = _prepCrossSwapQuotesRetrievalA2A(crossSwap, bridgeRoute, strategies);

  // 1. Get origin swap quote for any input token -> bridgeable input token
  const originSwapQuote = await originStrategy.fetchFn(
    {
      ...originSwap,
      depositor: crossSwap.depositor,
      amount: crossSwap.amount.toString(),
    },
    TradeType.EXACT_INPUT
  );

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForExactInput({
    inputToken: bridgeableInputToken,
    outputToken: bridgeableOutputToken,
    exactInputAmount: originSwapQuote.minAmountOut,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildExactInputBridgeTokenMessage(
      crossSwap,
      originSwapQuote.minAmountOut
    ),
  });

  // 3. Get destination swap quote for bridgeable output token -> any token
  const destinationSwapQuote = await destinationStrategy.fetchFn(
    {
      ...destinationSwap,
      amount: bridgeQuote.outputAmount.toString(),
    },
    TradeType.EXACT_INPUT
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
  const profiler = new Profiler({
    at: "api/_dexes/cross-swap-service#getCrossSwapQuotesForOutputByRouteA2A",
    logger: console,
  });
  const {
    originSwap,
    destinationSwap,
    originRouter,
    destinationRouter,
    depositEntryPoint,
    bridgeableInputToken,
    bridgeableOutputToken,
    destinationSwapChainId,
    originSwapEntryPoint,
    originStrategy,
    destinationStrategy,
  } = _prepCrossSwapQuotesRetrievalA2A(crossSwap, bridgeRoute, strategies);

  // Fetch INDICATIVE quotes sequentially:
  // 1. Destination swap quote for bridgeable output token -> any token
  // 2. Bridge quote for bridgeable input token -> bridgeable output token
  // 3. Origin swap quote for any input token -> bridgeable input token
  // These requests are faster but do not contain calldata.
  const indicativeDestinationSwapQuote = await profiler.measureAsync(
    destinationStrategy.fetchFn(
      {
        ...destinationSwap,
        amount: crossSwap.amount.toString(),
      },
      TradeType.EXACT_OUTPUT,
      {
        useIndicativeQuote: true,
      }
    ),
    "INDICATIVE_getDestinationSwapQuote"
  );
  const indicativeBridgeQuote = await profiler.measureAsync(
    getBridgeQuoteForMinOutput({
      inputToken: bridgeableInputToken,
      outputToken: bridgeableOutputToken,
      minOutputAmount: addMarkupToAmount(
        indicativeDestinationSwapQuote.maximumAmountIn,
        indicativeQuoteBuffer
      ),
      recipient: getMultiCallHandlerAddress(destinationSwapChainId),
      message: buildDestinationSwapCrossChainMessage({
        crossSwap,
        destinationSwapQuote: indicativeDestinationSwapQuote,
        bridgeableOutputToken,
        routerAddress: destinationRouter.address,
      }),
    }),
    "INDICATIVE_getBridgeQuote"
  );
  const indicativeOriginSwapQuote = await profiler.measureAsync(
    originStrategy.fetchFn(
      {
        ...originSwap,
        depositor: crossSwap.depositor,
        amount: addMarkupToAmount(
          indicativeBridgeQuote.inputAmount,
          indicativeQuoteBuffer
        ).toString(),
      },
      TradeType.EXACT_OUTPUT,
      {
        useIndicativeQuote: true,
      }
    ),
    "INDICATIVE_getOriginSwapQuote"
  );

  // Fetch REAL quotes in parallel. These requests are slower but contain calldata.
  const [destinationSwapQuote, bridgeQuote, originSwapQuote] =
    await profiler.measureAsync(
      Promise.all([
        destinationStrategy.fetchFn(
          {
            ...destinationSwap,
            amount: crossSwap.amount.toString(),
          },
          TradeType.EXACT_OUTPUT
        ),
        getBridgeQuoteForMinOutput({
          inputToken: bridgeableInputToken,
          outputToken: bridgeableOutputToken,
          minOutputAmount: indicativeDestinationSwapQuote.maximumAmountIn,
          recipient: getMultiCallHandlerAddress(destinationSwapChainId),
          message: buildDestinationSwapCrossChainMessage({
            crossSwap,
            destinationSwapQuote: indicativeDestinationSwapQuote,
            bridgeableOutputToken,
            routerAddress: destinationRouter.address,
          }),
        }),
        originStrategy.fetchFn(
          {
            ...originSwap,
            depositor: crossSwap.depositor,
            amount: addMarkupToAmount(
              indicativeOriginSwapQuote.maximumAmountIn,
              indicativeQuoteBuffer
            ).toString(),
          },
          TradeType.EXACT_INPUT
        ),
      ]),
      "getAllQuotes"
    );
  assertMinOutputAmount(destinationSwapQuote.minAmountOut, crossSwap.amount);
  assertMinOutputAmount(
    bridgeQuote.outputAmount,
    destinationSwapQuote.maximumAmountIn
  );
  assertMinOutputAmount(originSwapQuote.minAmountOut, bridgeQuote.inputAmount);

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
  strategies: QuoteFetchStrategies
) {
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
  const originStrategy = getQuoteFetchStrategy(
    originSwapChainId,
    crossSwap.inputToken.symbol,
    bridgeableInputToken.symbol,
    strategies
  );
  const destinationStrategy = getQuoteFetchStrategy(
    destinationSwapChainId,
    bridgeableOutputToken.symbol,
    crossSwap.outputToken.symbol,
    strategies
  );
  const multiCallHandlerAddress = getMultiCallHandlerAddress(
    destinationSwapChainId
  );
  const originSwapEntryPoint =
    originStrategy.getOriginEntryPoints(originSwapChainId).swapAndBridge;
  const depositEntryPoint =
    originStrategy.getOriginEntryPoints(originSwapChainId).deposit;
  const originRouter = originStrategy.getRouter(originSwapChainId);
  const destinationRouter = destinationStrategy.getRouter(
    destinationSwapChainId
  );
  const originSwap = {
    chainId: originSwapChainId,
    tokenIn: crossSwap.inputToken,
    tokenOut: bridgeableInputToken,
    recipient: originSwapEntryPoint.address,
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
    bridgeableInputToken,
    bridgeableOutputToken,
    originSwapEntryPoint,
    depositEntryPoint,
    originRouter,
    destinationRouter,
  };
}
