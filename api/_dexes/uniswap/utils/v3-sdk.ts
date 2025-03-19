import { Token, TradeType, CurrencyAmount } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { ethers } from "ethers";
import { utils } from "@across-protocol/sdk";

import { Swap, SwapQuote } from "../../types";
import { getProvider } from "../../../_utils";
import { NoSwapRouteError } from "../../../_swap-and-bridge";
import { floatToPercent } from "./conversion";

export async function getUniswapQuoteWithSwapRouter02FromSdk(
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
