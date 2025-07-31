import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import { CHAIN_IDs } from "@across-protocol/constants";
import { SwapRouter } from "@uniswap/universal-router-sdk";

import { getLogger, addMarkupToAmount } from "../../_utils";
import { QuoteFetchStrategy, Swap, SwapQuote } from "../types";
import {
  getUniswapClassicQuoteFromApi,
  getUniswapClassicIndicativeQuoteFromApi,
  UniswapClassicQuoteFromApi,
} from "./utils/trading-api";
import { floatToPercent } from "./utils/conversion";
import { RouterTradeAdapter } from "./utils/adapter";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";

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

const STRATEGY_NAME = "uniswap-v3/universal-router";

export function getUniversalRouterStrategy(): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    return {
      address: UNIVERSAL_ROUTER_ADDRESS[chainId],
      name: "UniswapV3UniversalRouter",
    };
  };

  const getOriginEntryPoints = (chainId: number) =>
    getOriginSwapEntryPoints("UniversalSwapAndBridge", chainId, STRATEGY_NAME);

  const getSources = makeGetSources({
    strategy: STRATEGY_NAME,
    sources: Object.keys(UNIVERSAL_ROUTER_ADDRESS).reduce(
      (acc, chainIdStr) => {
        const chainId = Number(chainIdStr);
        acc[chainId] = [
          {
            key: STRATEGY_NAME,
            names: ["uniswap_v3"],
          },
        ];
        return acc;
      },
      {} as Record<number, { key: string; names: string[] }[]>
    ),
  });

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts: Partial<{
      useIndicativeQuote: boolean;
    }> = {
      useIndicativeQuote: false,
    }
  ) => {
    let swapQuote: SwapQuote;
    if (!opts.useIndicativeQuote) {
      const { quote } = await getUniswapClassicQuoteFromApi(
        { ...swap, swapper: swap.recipient },
        tradeType
      );
      const swapTx = buildUniversalRouterSwapTx(swap, tradeType, quote);

      const expectedAmountIn = BigNumber.from(quote.input.amount);
      const maxAmountIn =
        tradeType === TradeType.EXACT_INPUT
          ? expectedAmountIn
          : addMarkupToAmount(expectedAmountIn, quote.slippage / 100);
      const expectedAmountOut = BigNumber.from(quote.output.amount);
      const minAmountOut =
        tradeType === TradeType.EXACT_OUTPUT
          ? expectedAmountOut
          : addMarkupToAmount(expectedAmountOut, -quote.slippage / 100);

      swapQuote = {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        maximumAmountIn: maxAmountIn,
        minAmountOut,
        expectedAmountOut,
        expectedAmountIn,
        slippageTolerance: quote.slippage,
        swapTxns: [swapTx],
        swapProvider: {
          name: STRATEGY_NAME,
          sources: ["uniswap_v3"],
        },
      };
    } else {
      const { input, output } = await getUniswapClassicIndicativeQuoteFromApi(
        { ...swap, swapper: swap.recipient },
        tradeType
      );

      const expectedAmountIn = BigNumber.from(input.amount);
      const maxAmountIn =
        tradeType === TradeType.EXACT_INPUT
          ? expectedAmountIn
          : addMarkupToAmount(expectedAmountIn, swap.slippageTolerance / 100);
      const expectedAmountOut = BigNumber.from(output.amount);
      const minAmountOut =
        tradeType === TradeType.EXACT_OUTPUT
          ? expectedAmountOut
          : addMarkupToAmount(expectedAmountOut, -swap.slippageTolerance / 100);

      swapQuote = {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        maximumAmountIn: maxAmountIn,
        minAmountOut,
        expectedAmountOut,
        expectedAmountIn,
        slippageTolerance: swap.slippageTolerance,
        swapTxns: [
          {
            to: "0x",
            data: "0x",
            value: "0x",
          },
        ],
        swapProvider: {
          name: STRATEGY_NAME,
          sources: ["uniswap_v3"],
        },
      };
    }

    getLogger().debug({
      at: "uniswap/universal-router/fetchFn",
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
    strategyName: STRATEGY_NAME,
    getRouter,
    getOriginEntryPoints,
    getSources,
    fetchFn,
  };
}

export function buildUniversalRouterSwapTx(
  swap: Swap,
  tradeType: TradeType,
  quote: UniswapClassicQuoteFromApi
) {
  const options = {
    recipient: swap.recipient,
    slippageTolerance: floatToPercent(swap.slippageTolerance),
  };
  const routerTrade = RouterTradeAdapter.fromClassicQuote({
    tokenIn: quote.input.token,
    tokenOut: quote.output.token,
    tradeType,
    route: quote.route,
  });
  const { calldata, value } = SwapRouter.swapCallParameters(
    routerTrade,
    options
  );
  return {
    data: calldata,
    value,
    to: UNIVERSAL_ROUTER_ADDRESS[swap.chainId],
  };
}
