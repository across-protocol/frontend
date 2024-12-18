import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";

import {
  getRouteByInputTokenAndDestinationChain,
  getTokenByAddress,
  getBridgeQuoteForMinOutput,
  getRoutesByChainIds,
  getRouteByOutputTokenAndOriginChain,
  Profiler,
} from "../../_utils";
import {
  buildMulticallHandlerMessage,
  encodeApproveCalldata,
  encodeDrainCalldata,
  encodeTransferCalldata,
  encodeWethWithdrawCalldata,
  getMultiCallHandlerAddress,
} from "../../_multicall-handler";
import {
  Token as AcrossToken,
  CrossSwap,
  CrossSwapQuotes,
  SwapQuote,
} from "../types";
import {
  buildExactOutputBridgeTokenMessage,
  buildMinOutputBridgeTokenMessage,
  getFallbackRecipient,
} from "../utils";
import { AMOUNT_TYPE } from "../cross-swap";
import { UniswapQuoteFetchStrategy, addMarkupToAmount } from "./utils";

const indicativeQuoteBuffer = 0.005; // 0.5% buffer for indicative quotes

/**
 * Returns Uniswap v3 quote for a swap based on the output amount (exact or minimal) for
 * route BRIDGEABLE input token -> ANY output token, e.g. USDC -> ARB. Required steps:
 * 1. Get destination swap quote for bridgeable output token -> any token
 * 2. Get bridge quote for bridgeable input token -> bridgeable output token
 * @param crossSwap - Cross swap params
 * @param strategy - Uniswap quote fetch strategy
 */
export async function getUniswapCrossSwapQuotesForOutputB2A(
  crossSwap: CrossSwap,
  strategy: UniswapQuoteFetchStrategy
): Promise<CrossSwapQuotes> {
  const profiler = new Profiler({
    at: "api/_dexes/uniswap/quote-resolver#getUniswapCrossSwapQuotesForOutputB2A",
    logger: console,
  });
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
  // 1. Get INDICATIVE destination swap quote for bridgeable output token -> any token
  //    with exact output amount. This request is faster but does not contain calldata.
  const indicativeDestinationSwapQuote = await strategy.fetchFn(
    {
      ...destinationSwap,
      amount: crossSwap.amount.toString(),
    },
    TradeType.EXACT_OUTPUT,
    {
      useIndicativeQuote: true,
    }
  );

  // 2. Fetch REAL destination swap quote and bridge quote in parallel to improve performance.
  const [destinationSwapQuote, bridgeQuote] = await Promise.all([
    // 2.1. REAL destination swap quote for bridgeable output token -> any token.
    //      Quote contains calldata.
    strategy.fetchFn(
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
        routerAddress: strategy.getRouterAddress(destinationSwapChainId),
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
    routerAddress: strategy.getRouterAddress(destinationSwapChainId),
  });

  return {
    crossSwap,
    bridgeQuote,
    destinationSwapQuote,
    originSwapQuote: undefined,
  };
}

/**
 * Returns Uniswap v3 quote for a swap with min. output amount for route
 * ANY input token -> BRIDGEABLE output token, e.g. ARB -> USDC. Required steps:
 * 1. Get bridge quote for bridgeable input token -> bridgeable output token
 * 2. Get origin swap quote for any input token -> bridgeable input token
 */
export async function getUniswapCrossSwapQuotesForOutputA2B(
  crossSwap: CrossSwap,
  strategy: UniswapQuoteFetchStrategy
): Promise<CrossSwapQuotes> {
  const profiler = new Profiler({
    at: "api/_dexes/uniswap/quote-resolver#getUniswapCrossSwapQuotesForOutputA2B",
    logger: console,
  });
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

  const originSwapEntryPoint =
    strategy.getOriginSwapEntryPoint(originSwapChainId);
  const originSwap = {
    chainId: originSwapChainId,
    tokenIn: crossSwap.inputToken,
    tokenOut: bridgeableInputToken,
    recipient: originSwapEntryPoint.address,
    slippageTolerance: crossSwap.slippageTolerance,
    type: crossSwap.type,
  };
  // 2.1. Get origin swap quote for any input token -> bridgeable input token
  const originSwapQuote = await profiler.measureAsync(
    strategy.fetchFn(
      {
        ...originSwap,
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
  let adjOriginSwapQuote = await strategy.fetchFn(
    {
      ...originSwap,
      amount: addMarkupToAmount(
        originSwapQuote.maximumAmountIn,
        indicativeQuoteBuffer
      ).toString(),
    },
    TradeType.EXACT_INPUT
  );
  assertMinOutputAmount(
    adjOriginSwapQuote.minAmountOut,
    bridgeQuote.inputAmount
  );

  return {
    crossSwap,
    bridgeQuote,
    destinationSwapQuote: undefined,
    originSwapQuote: {
      ...adjOriginSwapQuote,
      entryPointContract: originSwapEntryPoint,
    },
  };
}

/**
 * Returns Uniswap v3 quote for a swap with min. output amount for route
 * ANY input token -> ANY output token, e.g. ARB -> OP. We compare quotes from
 * different bridge routes and return the best one. In this iteration, we only
 * consider a hardcoded list of high-liquid bridge routes.
 * @param crossSwap
 * @param opts
 */
export async function getBestUniswapCrossSwapQuotesForOutputA2A(
  crossSwap: CrossSwap,
  originStrategy: UniswapQuoteFetchStrategy,
  destinationStrategy: UniswapQuoteFetchStrategy,
  opts: {
    preferredBridgeTokens: string[];
    bridgeRoutesLimit: number;
  }
): Promise<CrossSwapQuotes> {
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
    opts.preferredBridgeTokens.includes(toTokenSymbol)
  );
  const bridgeRoutesToCompare = (
    preferredBridgeRoutes.length > 0 ? preferredBridgeRoutes : allBridgeRoutes
  ).slice(0, opts.bridgeRoutesLimit);

  if (bridgeRoutesToCompare.length === 0) {
    throw new Error(
      `No bridge routes to compare for ${originSwapChainId} -> ${destinationSwapChainId}`
    );
  }

  const crossSwapQuotes = await Promise.all(
    bridgeRoutesToCompare.map((bridgeRoute) =>
      getUniswapCrossSwapQuotesForOutputA2A(
        crossSwap,
        bridgeRoute,
        originStrategy,
        destinationStrategy
      )
    )
  );

  // Compare quotes by lowest input amount
  const bestCrossSwapQuote = crossSwapQuotes.reduce((prev, curr) =>
    prev.originSwapQuote!.maximumAmountIn.lt(
      curr.originSwapQuote!.maximumAmountIn
    )
      ? prev
      : curr
  );
  return bestCrossSwapQuote;
}

/**
 * Returns Uniswap v3 quote for a swap with min. output amount for route
 * ANY input token -> ANY output token, e.g. ARB -> OP, using a specific bridge route.
 * @param crossSwap
 * @param bridgeRoute
 */
export async function getUniswapCrossSwapQuotesForOutputA2A(
  crossSwap: CrossSwap,
  bridgeRoute: {
    fromTokenAddress: string;
    fromChain: number;
    toTokenAddress: string;
    toChain: number;
  },
  originStrategy: UniswapQuoteFetchStrategy,
  destinationStrategy: UniswapQuoteFetchStrategy
): Promise<CrossSwapQuotes> {
  const profiler = new Profiler({
    at: "api/_dexes/uniswap/quote-resolver#getUniswapCrossSwapQuotesForOutputA2A",
    logger: console,
  });
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
  const multiCallHandlerAddress = getMultiCallHandlerAddress(
    destinationSwapChainId
  );
  const originSwapEntryPoint =
    originStrategy.getOriginSwapEntryPoint(originSwapChainId);
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
        routerAddress: destinationStrategy.getRouterAddress(
          destinationSwapChainId
        ),
      }),
    }),
    "INDICATIVE_getBridgeQuote"
  );
  const indicativeOriginSwapQuote = await profiler.measureAsync(
    originStrategy.fetchFn(
      {
        ...originSwap,
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
            routerAddress: destinationStrategy.getRouterAddress(
              destinationSwapChainId
            ),
          }),
        }),
        originStrategy.fetchFn(
          {
            ...originSwap,
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
    routerAddress: destinationStrategy.getRouterAddress(destinationSwapChainId),
  });

  return {
    crossSwap,
    destinationSwapQuote,
    bridgeQuote,
    originSwapQuote: {
      ...originSwapQuote,
      entryPointContract: originSwapEntryPoint,
    },
  };
}

function buildDestinationSwapCrossChainMessage({
  crossSwap,
  destinationSwapQuote,
  bridgeableOutputToken,
  routerAddress,
}: {
  crossSwap: CrossSwap;
  bridgeableOutputToken: AcrossToken;
  destinationSwapQuote: SwapQuote;
  routerAddress: string;
}) {
  const destinationSwapChainId = destinationSwapQuote.tokenOut.chainId;
  const isIndicativeQuote =
    destinationSwapQuote.swapTx.to === "0x0" &&
    destinationSwapQuote.swapTx.data === "0x0" &&
    destinationSwapQuote.swapTx.value === "0x0";

  let transferActions: {
    target: string;
    callData: string;
    value: string;
  }[] = [];

  // If output token is native, we need to unwrap WETH before sending it to the
  // recipient. This is because we only handle WETH in the destination swap.
  if (crossSwap.isOutputNative) {
    transferActions = [
      {
        target: crossSwap.outputToken.address,
        callData: encodeWethWithdrawCalldata(crossSwap.amount),
        value: "0",
      },
      {
        target: crossSwap.recipient,
        callData: "0x",
        value: crossSwap.amount.toString(),
      },
    ];
  }
  // If output token is an ERC-20 token and amount type is EXACT_OUTPUT, we need
  // to transfer the EXACT output amount to the recipient. The refundAddress / depositor
  // will receive any leftovers.
  else if (crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT) {
    transferActions = [
      {
        target: crossSwap.outputToken.address,
        callData: encodeTransferCalldata(crossSwap.recipient, crossSwap.amount),
        value: "0",
      },
      {
        target: getMultiCallHandlerAddress(destinationSwapChainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.refundAddress ?? crossSwap.depositor
        ),
        value: "0",
      },
    ];
  }
  // If output token is an ERC-20 token and amount type is MIN_OUTPUT, we need
  // to transfer all realized output tokens to the recipient.
  else if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT) {
    transferActions = [
      {
        target: getMultiCallHandlerAddress(destinationSwapChainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.recipient
        ),
        value: "0",
      },
    ];
  }

  const swapActions = isIndicativeQuote
    ? []
    : [
        {
          target: destinationSwapQuote.swapTx.to,
          callData: destinationSwapQuote.swapTx.data,
          value: destinationSwapQuote.swapTx.value,
        },
      ];

  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      // approve bridgeable output token
      {
        target: bridgeableOutputToken.address,
        callData: encodeApproveCalldata(
          routerAddress,
          destinationSwapQuote.maximumAmountIn
        ),
        value: "0",
      },
      // swap bridgeable output token -> cross swap output token
      ...swapActions,
      // transfer output tokens to recipient
      ...transferActions,
      // drain remaining bridgeable output tokens from MultiCallHandler contract
      {
        target: getMultiCallHandlerAddress(destinationSwapChainId),
        callData: encodeDrainCalldata(
          bridgeableOutputToken.address,
          crossSwap.refundAddress ?? crossSwap.depositor
        ),
        value: "0",
      },
    ],
  });
}

function assertMinOutputAmount(
  amountOut: BigNumber,
  expectedMinAmountOut: BigNumber
) {
  if (amountOut.lt(expectedMinAmountOut)) {
    throw new Error(
      `Swap quote output amount ${amountOut.toString()} ` +
        `is less than required min. output amount ${expectedMinAmountOut.toString()}`
    );
  }
}
