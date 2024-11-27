import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import { CHAIN_IDs } from "@across-protocol/constants";

import { getLogger } from "../../_utils";
import { Swap } from "../types";
import { getSpokePoolPeripheryAddress } from "../../_spoke-pool-periphery";
import {
  getUniswapClassicCalldataFromApi,
  getUniswapClassicQuoteFromApi,
} from "./trading-api";
import { UniswapQuoteFetchStrategy, addMarkupToAmount } from "./utils";

// https://uniswap-docs.readme.io/reference/faqs#i-need-to-whitelist-the-router-addresses-where-can-i-find-them
export const UNIVERSAL_ROUTER_ADDRESS = {
  [CHAIN_IDs.ARBITRUM]: "0x5E325eDA8064b456f4781070C0738d849c824258",
  [CHAIN_IDs.BASE]: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
  [CHAIN_IDs.BLAST]: "0x643770E279d5D0733F21d6DC03A8efbABf3255B4",
  [CHAIN_IDs.MAINNET]: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
  [CHAIN_IDs.OPTIMISM]: "0xCb1355ff08Ab38bBCE60111F1bb2B784bE25D7e8",
  [CHAIN_IDs.POLYGON]: "0xec7BE89e9d109e7e3Fec59c222CF297125FEFda2",
  [CHAIN_IDs.WORLD_CHAIN]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  [CHAIN_IDs.ZORA]: "0x2986d9721A49838ab4297b695858aF7F17f38014",
  [CHAIN_IDs.ZK_SYNC]: "0x28731BCC616B5f51dD52CF2e4dF0E78dD1136C06",
};

export function getUniversalRouterStrategy(): UniswapQuoteFetchStrategy {
  const getRouterAddress = (chainId: number) =>
    UNIVERSAL_ROUTER_ADDRESS[chainId];
  const getPeripheryAddress = (chainId: number) =>
    getSpokePoolPeripheryAddress("uniswap-universalRouter", chainId);

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts: Partial<{
      useIndicativeQuote: boolean;
    }> = {
      useIndicativeQuote: false,
    }
  ) => {
    const { quote } = await getUniswapClassicQuoteFromApi(
      { ...swap, swapper: swap.recipient },
      tradeType
    );
    const classicSwap = opts.useIndicativeQuote
      ? {
          swap: {
            to: "0x",
            data: "0x",
            value: "0x",
          },
        }
      : await getUniswapClassicCalldataFromApi(quote);

    const expectedAmountIn = BigNumber.from(quote.input.amount);
    const maxAmountIn =
      tradeType === TradeType.EXACT_INPUT
        ? expectedAmountIn
        : addMarkupToAmount(expectedAmountIn, quote.slippage / 100);
    const expectedAmountOut = BigNumber.from(quote.output.amount);
    const minAmountOut =
      tradeType === TradeType.EXACT_OUTPUT
        ? expectedAmountOut
        : addMarkupToAmount(expectedAmountOut, quote.slippage / 100);

    const swapQuote = {
      tokenIn: swap.tokenIn,
      tokenOut: swap.tokenOut,
      maximumAmountIn: maxAmountIn,
      minAmountOut,
      expectedAmountOut,
      expectedAmountIn,
      slippageTolerance: quote.slippage,
      swapTx: {
        to: classicSwap.swap.to,
        data: classicSwap.swap.data,
        value: classicSwap.swap.value,
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
