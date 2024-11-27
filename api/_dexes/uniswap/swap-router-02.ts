import { ethers } from "ethers";
import { CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { CHAIN_IDs } from "@across-protocol/constants";
import { utils } from "@across-protocol/sdk";

import { getProvider, getLogger } from "../../_utils";
import { Swap } from "../types";
import { NoSwapRouteError } from "../utils";
import { getSpokePoolPeripheryAddress } from "../../_spoke-pool-periphery";
import { UniswapQuoteFetchStrategy } from "./utils";

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

export function getSwapRouter02Strategy(): UniswapQuoteFetchStrategy {
  const getRouterAddress = (chainId: number) => SWAP_ROUTER_02_ADDRESS[chainId];
  const getPeripheryAddress = (chainId: number) =>
    getSpokePoolPeripheryAddress("uniswap-swapRouter02", chainId);

  const fetchFn = async (swap: Swap, tradeType: TradeType) => {
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
      at: "uniswap/universal-router/quoteFetchFn",
      message: "Swap quote",
      type:
        tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
      tokenIn: swapQuote.tokenIn.symbol,
      tokenOut: swapQuote.tokenOut.symbol,
      chainId: swap.chainId,
      maximumAmountIn: swapQuote.maximumAmountIn.toString(),
      minAmountOut: swapQuote.minAmountOut.toString(),
      expectedAmountOut: swapQuote.expectedAmountOut.toString(),
      expectedAmountIn: swapQuote.expectedAmountIn.toString(),
    });

    return swapQuote;
  };

  return {
    getRouterAddress,
    getPeripheryAddress,
    fetchFn,
  };
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
