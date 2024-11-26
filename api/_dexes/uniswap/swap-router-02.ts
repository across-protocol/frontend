import { BigNumber, ethers } from "ethers";
import { CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { CHAIN_IDs } from "@across-protocol/constants";
import { utils } from "@across-protocol/sdk";

import {
  getProvider,
  getRouteByInputTokenAndDestinationChain,
  getTokenByAddress,
  getBridgeQuoteForMinOutput,
  getRoutesByChainIds,
  getRouteByOutputTokenAndOriginChain,
  getLogger,
} from "../../_utils";
import {
  buildMulticallHandlerMessage,
  encodeApproveCalldata,
  encodeDrainCalldata,
  encodeTransferCalldata,
  encodeWethWithdrawCalldata,
  getMultiCallHandlerAddress,
} from "../../_multicall-handler";
import { Token as AcrossToken, Swap, CrossSwap, SwapQuote } from "../types";
import {
  buildExactOutputBridgeTokenMessage,
  buildMinOutputBridgeTokenMessage,
  getFallbackRecipient,
  NoSwapRouteError,
} from "../utils";
import { AMOUNT_TYPE } from "../cross-swap";
import { getSpokePoolPeripheryAddress } from "../../_spoke-pool-periphery";

// Taken from here: https://docs.uniswap.org/contracts/v3/reference/deployments/
export const SWAP_ROUTER_02_ADDRESS = {
  [CHAIN_IDs.ARBITRUM]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.BASE]: "0x2626664c2603336E57B271c5C0b26F421741e481",
  [CHAIN_IDs.BLAST]: "0x549FEB8c9bd4c12Ad2AB27022dA12492aC452B66",
  [CHAIN_IDs.MAINNET]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.OPTIMISM]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.POLYGON]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  [CHAIN_IDs.WORLD_CHAIN]: "0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6",
  [CHAIN_IDs.ZK_SYNC]: "0x99c56385daBCE3E81d8499d0b8d0257aBC07E8A3",
  [CHAIN_IDs.ZORA]: "0x7De04c96BE5159c3b5CeffC82aa176dc81281557",
};

/**
 * Returns Uniswap v3 quote for a swap with min. output amount for route
 * BRIDGEABLE input token -> ANY output token, e.g. USDC -> ARB. Required steps:
 * 1. Get destination swap quote for bridgeable output token -> any token
 * 2. Get bridge quote for bridgeable input token -> bridgeable output token
 */
export async function getUniswapCrossSwapQuotesForOutputB2A(
  crossSwap: CrossSwap
) {
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
  };
  // 1.1. Get destination swap quote for bridgeable output token -> any token
  //      with exact output amount.
  let destinationSwapQuote = await getUniswapQuoteWithSwapRouter02(
    {
      ...destinationSwap,
      amount: crossSwap.amount.toString(),
    },
    TradeType.EXACT_OUTPUT
  );
  // 1.2. Re-fetch destination swap quote with exact input amount if leftover tokens
  //      should be sent to receiver.
  if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT) {
    destinationSwapQuote = await getUniswapQuoteWithSwapRouter02(
      {
        ...destinationSwap,
        amount: addBufferToAmount(destinationSwapQuote.maximumAmountIn),
      },
      TradeType.EXACT_INPUT
    );
    assertMinOutputAmount(destinationSwapQuote.minAmountOut, crossSwap.amount);
  }

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: crossSwap.inputToken,
    outputToken: bridgeableOutputToken,
    minOutputAmount: destinationSwapQuote.maximumAmountIn,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote,
      bridgeableOutputToken,
    }),
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
  crossSwap: CrossSwap
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

  const originSwap = {
    chainId: originSwapChainId,
    tokenIn: crossSwap.inputToken,
    tokenOut: bridgeableInputToken,
    recipient: getSpokePoolPeripheryAddress("uniswap", originSwapChainId),
    slippageTolerance: crossSwap.slippageTolerance,
  };
  // 2.1. Get origin swap quote for any input token -> bridgeable input token
  const originSwapQuote = await getUniswapQuoteWithSwapRouter02(
    {
      ...originSwap,
      amount: bridgeQuote.inputAmount.toString(),
    },
    TradeType.EXACT_OUTPUT
  );
  // 2.2. Re-fetch origin swap quote with updated input amount and EXACT_INPUT type.
  //      This prevents leftover tokens in the SwapAndBridge contract.
  let adjOriginSwapQuote = await getUniswapQuoteWithSwapRouter02(
    {
      ...originSwap,
      amount: addBufferToAmount(originSwapQuote.maximumAmountIn),
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
    originSwapQuote: adjOriginSwapQuote,
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
  opts: {
    preferredBridgeTokens: string[];
    bridgeRoutesLimit: number;
  }
) {
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
      getUniswapCrossSwapQuotesForOutputA2A(crossSwap, bridgeRoute)
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
  }
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
  const originSwap = {
    chainId: originSwapChainId,
    tokenIn: crossSwap.inputToken,
    tokenOut: bridgeableInputToken,
    recipient: getSpokePoolPeripheryAddress("uniswap", originSwapChainId),
    slippageTolerance: crossSwap.slippageTolerance,
  };
  const destinationSwap = {
    chainId: destinationSwapChainId,
    tokenIn: bridgeableOutputToken,
    tokenOut: crossSwap.outputToken,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    slippageTolerance: crossSwap.slippageTolerance,
  };

  // 1.1. Get destination swap quote for bridgeable output token -> any token
  //      with exact output amount
  let destinationSwapQuote = await getUniswapQuoteWithSwapRouter02(
    {
      ...destinationSwap,
      amount: crossSwap.amount.toString(),
    },
    TradeType.EXACT_OUTPUT
  );
  // 1.2. Re-fetch destination swap quote with exact input amount if leftover tokens
  //      should be sent to receiver.
  if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT) {
    destinationSwapQuote = await getUniswapQuoteWithSwapRouter02(
      {
        ...destinationSwap,
        amount: addBufferToAmount(destinationSwapQuote.maximumAmountIn),
      },
      TradeType.EXACT_INPUT
    );
    assertMinOutputAmount(destinationSwapQuote.minAmountOut, crossSwap.amount);
  }

  // 2. Get bridge quote for bridgeable input token -> bridgeable output token
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: bridgeableInputToken,
    outputToken: bridgeableOutputToken,
    minOutputAmount: destinationSwapQuote.expectedAmountIn,
    recipient: getMultiCallHandlerAddress(destinationSwapChainId),
    message: buildDestinationSwapCrossChainMessage({
      crossSwap,
      destinationSwapQuote,
      bridgeableOutputToken,
    }),
  });

  // 3.1. Get origin swap quote for any input token -> bridgeable input token
  const originSwapQuote = await getUniswapQuoteWithSwapRouter02(
    {
      ...originSwap,
      amount: bridgeQuote.inputAmount.toString(),
    },
    TradeType.EXACT_OUTPUT
  );
  // 3.2. Re-fetch origin swap quote with updated input amount and EXACT_INPUT type.
  //      This prevents leftover tokens in the SwapAndBridge contract.
  const adjOriginSwapQuote = await getUniswapQuoteWithSwapRouter02(
    {
      ...originSwap,
      amount: addBufferToAmount(originSwapQuote.maximumAmountIn),
    },
    TradeType.EXACT_INPUT
  );
  assertMinOutputAmount(
    adjOriginSwapQuote.minAmountOut,
    bridgeQuote.inputAmount
  );

  return {
    crossSwap,
    destinationSwapQuote,
    bridgeQuote,
    originSwapQuote: adjOriginSwapQuote,
  };
}

export async function getUniswapQuoteWithSwapRouter02(
  swap: Omit<Swap, "type">,
  tradeType: TradeType
): Promise<SwapQuote> {
  const { router, options } = getSwapRouter02AndOptions(swap);

  const amountCurrency =
    tradeType === TradeType.EXACT_INPUT ? swap.tokenIn : swap.tokenOut;
  const quoteCurrency =
    tradeType === TradeType.EXACT_INPUT ? swap.tokenOut : swap.tokenIn;

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      new Token(
        amountCurrency.chainId,
        amountCurrency.address,
        amountCurrency.decimals
      ),
      swap.amount
    ),
    new Token(
      quoteCurrency.chainId,
      quoteCurrency.address,
      quoteCurrency.decimals
    ),
    tradeType,
    options
  );

  if (!route || !route.methodParameters) {
    throw new NoSwapRouteError({
      dex: "uniswap",
      tokenInSymbol: swap.tokenIn.symbol,
      tokenOutSymbol: swap.tokenOut.symbol,
      chainId: swap.chainId,
      swapType:
        tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
    });
  }

  const swapQuote = {
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    maximumAmountIn: ethers.utils.parseUnits(
      route.trade.maximumAmountIn(options.slippageTolerance).toExact(),
      swap.tokenIn.decimals
    ),
    minAmountOut: ethers.utils.parseUnits(
      route.trade.minimumAmountOut(options.slippageTolerance).toExact(),
      swap.tokenOut.decimals
    ),
    expectedAmountOut: ethers.utils.parseUnits(
      route.trade.outputAmount.toExact(),
      swap.tokenOut.decimals
    ),
    expectedAmountIn: ethers.utils.parseUnits(
      route.trade.inputAmount.toExact(),
      swap.tokenIn.decimals
    ),
    slippageTolerance: swap.slippageTolerance,
    swapTx: {
      to: route.methodParameters.to,
      data: route.methodParameters.calldata,
      value: route.methodParameters.value,
    },
  };

  getLogger().debug({
    at: "uniswap/getUniswapQuoteWithSwapRouter02",
    message: "Swap quote",
    type: tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
    tokenIn: swapQuote.tokenIn.symbol,
    tokenOut: swapQuote.tokenOut.symbol,
    chainId: swap.chainId,
    maximumAmountIn: swapQuote.maximumAmountIn.toString(),
    minAmountOut: swapQuote.minAmountOut.toString(),
    expectedAmountOut: swapQuote.expectedAmountOut.toString(),
    expectedAmountIn: swapQuote.expectedAmountIn.toString(),
  });

  return swapQuote;
}

function getSwapRouter02AndOptions(params: {
  chainId: number;
  recipient: string;
  slippageTolerance: number;
}) {
  const router = getSwapRouter02(params.chainId);
  const options: SwapOptionsSwapRouter02 = {
    recipient: params.recipient,
    deadline: utils.getCurrentTime() + 30 * 60, // 30 minutes from now
    type: SwapType.SWAP_ROUTER_02,
    slippageTolerance: floatToPercent(params.slippageTolerance),
  };
  return {
    router,
    options,
  };
}

const swapRouterCache = new Map<number, AlphaRouter>();
function getSwapRouter02(chainId: number) {
  const provider = getProvider(chainId);
  if (!swapRouterCache.has(chainId)) {
    swapRouterCache.set(chainId, new AlphaRouter({ chainId, provider }));
  }
  return swapRouterCache.get(chainId)!;
}

function floatToPercent(value: number) {
  return new Percent(
    // max. slippage decimals is 2
    Number(value.toFixed(2)) * 100,
    10_000
  );
}

function buildDestinationSwapCrossChainMessage({
  crossSwap,
  destinationSwapQuote,
  bridgeableOutputToken,
}: {
  crossSwap: CrossSwap;
  bridgeableOutputToken: AcrossToken;
  destinationSwapQuote: SwapQuote;
}) {
  const destinationSwapChainId = destinationSwapQuote.tokenOut.chainId;

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

  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      // approve bridgeable output token
      {
        target: bridgeableOutputToken.address,
        callData: encodeApproveCalldata(
          SWAP_ROUTER_02_ADDRESS[destinationSwapChainId],
          destinationSwapQuote.maximumAmountIn
        ),
        value: "0",
      },
      // swap bridgeable output token -> cross swap output token
      {
        target: destinationSwapQuote.swapTx.to,
        callData: destinationSwapQuote.swapTx.data,
        value: destinationSwapQuote.swapTx.value,
      },
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

function addBufferToAmount(amount: BigNumber, buffer = 0.01) {
  return amount
    .mul(ethers.utils.parseEther((1 + Number(buffer)).toString()))
    .div(utils.fixedPointAdjustment)
    .toString();
}
