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
} from "../_utils";
import { TOKEN_SYMBOLS_MAP } from "../_constants";
import {
  buildMulticallHandlerMessage,
  encodeApproveCalldata,
  encodeDrainCalldata,
  encodeWethWithdrawCalldata,
  getMultiCallHandlerAddress,
} from "../_multicall-handler";
import {
  OriginSwapQuoteAndCalldata,
  Token as AcrossToken,
  Swap,
  CrossSwap,
  SwapQuote,
} from "./types";
import {
  buildExactOutputBridgeTokenMessage,
  getSwapAndBridgeAddress,
  NoSwapRouteError,
} from "./utils";
import { LEFTOVER_TYPE } from "./cross-swap";

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

// Maps testnet chain IDs to their prod counterparts. Used to get the prod token
// info for testnet tokens.
const TESTNET_TO_PROD = {
  [CHAIN_IDs.SEPOLIA]: CHAIN_IDs.MAINNET,
  [CHAIN_IDs.BASE_SEPOLIA]: CHAIN_IDs.BASE,
  [CHAIN_IDs.OPTIMISM_SEPOLIA]: CHAIN_IDs.OPTIMISM,
  [CHAIN_IDs.ARBITRUM_SEPOLIA]: CHAIN_IDs.ARBITRUM,
};

/**
 * Returns Uniswap v3 quote for a swap with exact input amount.
 * @param swap
 */
export async function getUniswapQuoteForOriginSwapExactInput(
  swap: Omit<Swap, "recipient">
): Promise<OriginSwapQuoteAndCalldata> {
  const swapAndBridgeAddress = getSwapAndBridgeAddress("uniswap", swap.chainId);

  const initialTokenIn = { ...swap.tokenIn };
  const initialTokenOut = { ...swap.tokenOut };
  // Always use mainnet tokens for retrieving quote, so that we can get equivalent quotes
  // for testnet tokens.
  swap.tokenIn = getProdToken(swap.tokenIn);
  swap.tokenOut = getProdToken(swap.tokenOut);

  const { swapTx, minAmountOut } = await getUniswapQuote(
    {
      ...swap,
      recipient: swapAndBridgeAddress,
    },
    TradeType.EXACT_INPUT
  );

  // replace mainnet token addresses with initial token addresses in calldata
  swapTx.data = swapTx.data.replace(
    swap.tokenIn.address.toLowerCase().slice(2),
    initialTokenIn.address.toLowerCase().slice(2)
  );
  swapTx.data = swapTx.data.replace(
    swap.tokenOut.address.toLowerCase().slice(2),
    initialTokenOut.address.toLowerCase().slice(2)
  );

  return {
    minExpectedInputTokenAmount: minAmountOut.toString(),
    routerCalldata: swapTx.data,
    value: BigNumber.from(swapTx.value).toString(),
    swapAndBridgeAddress,
    dex: "uniswap",
    slippage: swap.slippageTolerance,
  };
}

/**
 * Returns Uniswap v3 quote for a swap with min. output amount for route
 * BRIDGEABLE input token -> ANY output token, e.g. USDC -> ARB. Required steps:
 * 1. Get destination swap quote for bridgeable output token -> any token
 * 2. Get bridge quote for bridgeable input token -> bridgeable output token
 */
export async function getUniswapCrossSwapQuotesForMinOutputB2A(
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
    recipient: crossSwap.isOutputNative
      ? getMultiCallHandlerAddress(destinationSwapChainId)
      : crossSwap.recipient,
    slippageTolerance: crossSwap.slippageTolerance,
  };
  // 1.1. Get destination swap quote for bridgeable output token -> any token
  //      with exact output amount.
  let destinationSwapQuote = await getUniswapQuote(
    {
      ...destinationSwap,
      amount: crossSwap.amount.toString(),
    },
    TradeType.EXACT_OUTPUT
  );
  // 1.2. Re-fetch destination swap quote with exact input amount if leftover tokens
  //      should be sent as output tokens instead of bridgeable output tokens.
  if (crossSwap.leftoverType === LEFTOVER_TYPE.OUTPUT_TOKEN) {
    destinationSwapQuote = await getUniswapQuote(
      {
        ...destinationSwap,
        amount: destinationSwapQuote.maximumAmountIn
          .mul(
            ethers.utils.parseEther(
              (1 + Number(crossSwap.slippageTolerance) / 100).toString()
            )
          )
          .div(utils.fixedPointAdjustment)
          .toString(),
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
export async function getUniswapCrossSwapQuotesForMinOutputA2B(
  crossSwap: CrossSwap
) {
  const originSwapChainId = crossSwap.inputToken.chainId;
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
    message: buildExactOutputBridgeTokenMessage(crossSwap),
  });

  const originSwap = {
    chainId: originSwapChainId,
    tokenIn: crossSwap.inputToken,
    tokenOut: bridgeableInputToken,
    recipient: getSwapAndBridgeAddress("uniswap", originSwapChainId),
    slippageTolerance: crossSwap.slippageTolerance,
  };
  // 2.1. Get origin swap quote for any input token -> bridgeable input token
  const originSwapQuote = await getUniswapQuote(
    {
      ...originSwap,
      amount: bridgeQuote.inputAmount.toString(),
    },
    TradeType.EXACT_OUTPUT
  );
  // 2.2. Re-fetch origin swap quote with updated input amount and EXACT_INPUT type.
  //      This prevents leftover tokens in the SwapAndBridge contract.
  const adjOriginSwapQuote = await getUniswapQuote(
    {
      ...originSwap,
      amount: originSwapQuote.maximumAmountIn.toString(),
    },
    TradeType.EXACT_INPUT
  );

  if (adjOriginSwapQuote.minAmountOut.lt(bridgeQuote.inputAmount)) {
    throw new Error(
      `Origin swap quote min. output amount ${adjOriginSwapQuote.minAmountOut.toString()} ` +
        `is less than required bridge input amount ${bridgeQuote.inputAmount.toString()}`
    );
  }

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
export async function getBestUniswapCrossSwapQuotesForMinOutputA2A(
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
      getUniswapCrossSwapQuotesForMinOutputA2A(crossSwap, bridgeRoute)
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
export async function getUniswapCrossSwapQuotesForMinOutputA2A(
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
    recipient: getSwapAndBridgeAddress("uniswap", originSwapChainId),
    slippageTolerance: crossSwap.slippageTolerance,
  };
  const destinationSwap = {
    chainId: destinationSwapChainId,
    tokenIn: bridgeableOutputToken,
    tokenOut: crossSwap.outputToken,
    recipient: crossSwap.recipient,
    slippageTolerance: crossSwap.slippageTolerance,
  };

  // 1.1. Get destination swap quote for bridgeable output token -> any token
  //      with exact output amount
  let destinationSwapQuote = await getUniswapQuote(
    {
      ...destinationSwap,
      amount: crossSwap.amount.toString(),
    },
    TradeType.EXACT_OUTPUT
  );
  // 1.2. Re-fetch destination swap quote with exact input amount if leftover tokens
  //      should be sent as output tokens instead of bridgeable output tokens.
  if (crossSwap.leftoverType === LEFTOVER_TYPE.OUTPUT_TOKEN) {
    destinationSwapQuote = await getUniswapQuote(
      {
        ...destinationSwap,
        amount: destinationSwapQuote.maximumAmountIn
          .mul(
            ethers.utils.parseEther(
              (1 + Number(crossSwap.slippageTolerance) / 100).toString()
            )
          )
          .div(utils.fixedPointAdjustment)
          .toString(),
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
  const originSwapQuote = await getUniswapQuote(
    {
      ...originSwap,
      amount: bridgeQuote.inputAmount.toString(),
    },
    TradeType.EXACT_OUTPUT
  );
  // 3.2. Re-fetch origin swap quote with updated input amount and EXACT_INPUT type.
  //      This prevents leftover tokens in the SwapAndBridge contract.
  const adjOriginSwapQuote = await getUniswapQuote(
    {
      ...originSwap,
      amount: originSwapQuote.maximumAmountIn.toString(),
    },
    TradeType.EXACT_INPUT
  );

  return {
    crossSwap,
    destinationSwapQuote,
    bridgeQuote,
    originSwapQuote: adjOriginSwapQuote,
  };
}

export async function getUniswapQuote(
  swap: Omit<Swap, "type">,
  tradeType: TradeType
): Promise<SwapQuote> {
  const { router, options } = getSwapRouterAndOptions(swap);

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

  console.log("swapQuote", {
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

function getSwapRouterAndOptions(params: {
  chainId: number;
  recipient: string;
  slippageTolerance: number;
}) {
  const provider = getProvider(params.chainId);
  const router = new AlphaRouter({
    chainId: params.chainId,
    provider,
  });
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

function floatToPercent(value: number) {
  return new Percent(
    // max. slippage decimals is 2
    Number(value.toFixed(2)) * 100,
    10_000
  );
}

function getProdToken(token: AcrossToken) {
  const prodChainId = TESTNET_TO_PROD[token.chainId] || token.chainId;

  const prodToken =
    TOKEN_SYMBOLS_MAP[token.symbol as keyof typeof TOKEN_SYMBOLS_MAP];
  const prodTokenAddress = prodToken?.addresses[prodChainId];

  if (!prodToken || !prodTokenAddress) {
    throw new Error(
      `Prod token not found for ${token.symbol} on chain ${token.chainId}`
    );
  }

  return {
    ...prodToken,
    chainId: prodChainId,
    address: prodTokenAddress,
  };
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
  const nativeEthActions = crossSwap.isOutputNative
    ? // If output token is native, we need to unwrap WETH before sending it to the
      // recipient. This is because we only handle WETH in the destination swap.
      [
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
      ]
    : [];
  return buildMulticallHandlerMessage({
    // @TODO: handle fallback recipient for params `refundOnOrigin` and `refundAddress`
    fallbackRecipient: crossSwap.depositor,
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
      ...nativeEthActions,
      // drain remaining bridgeable output tokens from MultiCallHandler contract
      {
        target: getMultiCallHandlerAddress(destinationSwapChainId),
        callData: encodeDrainCalldata(
          bridgeableOutputToken.address,
          crossSwap.depositor
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
