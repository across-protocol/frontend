import { BigNumber, ethers } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import { SwapRouter } from "@uniswap/router-sdk";

import { CHAIN_IDs } from "@across-protocol/constants";

import {
  getLogger,
  getSpokePoolAddress,
  addMarkupToAmount,
} from "../../_utils";
import { Swap, SwapQuote } from "../types";
import {
  getSpokePoolPeripheryAddress,
  getSpokePoolPeripheryProxyAddress,
} from "../../_spoke-pool-periphery";
import { getUniversalSwapAndBridgeAddress } from "../../_swap-and-bridge";
import { floatToPercent, UniswapQuoteFetchStrategy } from "./utils";
import {
  getUniswapClassicQuoteFromApi,
  getUniswapClassicIndicativeQuoteFromApi,
  UniswapClassicQuoteFromApi,
} from "./trading-api";
import { RouterTradeAdapter } from "./adapter";
import { buildCacheKey, makeCacheGetterAndSetter } from "../../_cache";

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

export function getSwapRouter02Strategy(
  originSwapEntryPointContractName:
    | "SpokePoolPeriphery"
    | "SpokePoolPeripheryProxy"
    | "UniversalSwapAndBridge"
): UniswapQuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    return {
      address: SWAP_ROUTER_02_ADDRESS[chainId],
      name: "UniswapV3SwapRouter02",
    };
  };
  const getOriginEntryPoints = (chainId: number) => {
    if (originSwapEntryPointContractName === "SpokePoolPeripheryProxy") {
      return {
        swapAndBridge: {
          name: "SpokePoolPeripheryProxy",
          address: getSpokePoolPeripheryProxyAddress(chainId),
        },
        deposit: {
          name: "SpokePoolPeriphery",
          address: getSpokePoolPeripheryAddress(chainId),
        },
      } as const;
    } else if (originSwapEntryPointContractName === "SpokePoolPeriphery") {
      return {
        swapAndBridge: {
          name: "SpokePoolPeriphery",
          address: getSpokePoolPeripheryAddress(chainId),
        },
        deposit: {
          name: "SpokePoolPeriphery",
          address: getSpokePoolPeripheryAddress(chainId),
        },
      } as const;
    } else if (originSwapEntryPointContractName === "UniversalSwapAndBridge") {
      return {
        swapAndBridge: {
          name: "UniversalSwapAndBridge",
          address: getUniversalSwapAndBridgeAddress("uniswap", chainId),
          dex: "uniswap",
        },
        deposit: {
          name: "SpokePool",
          address: getSpokePoolAddress(chainId),
        },
      } as const;
    }
    throw new Error(
      `Unknown origin swap entry point contract '${originSwapEntryPointContractName}'`
    );
  };

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
      const swapTx = buildSwapRouterSwapTx(swap, tradeType, quote);

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
        swapTx,
      };
    } else {
      const indicativeQuotePricePerTokenOut = await indicativeQuotePriceCache(
        swap,
        tradeType
      ).get();
      const inputAmount =
        tradeType === TradeType.EXACT_INPUT
          ? swap.amount
          : ethers.utils.parseUnits(
              (
                Number(
                  ethers.utils.formatUnits(swap.amount, swap.tokenOut.decimals)
                ) * indicativeQuotePricePerTokenOut
              ).toFixed(swap.tokenIn.decimals),
              swap.tokenIn.decimals
            );
      const outputAmount =
        tradeType === TradeType.EXACT_INPUT
          ? ethers.utils.parseUnits(
              (
                Number(
                  ethers.utils.formatUnits(swap.amount, swap.tokenIn.decimals)
                ) / indicativeQuotePricePerTokenOut
              ).toFixed(swap.tokenOut.decimals),
              swap.tokenOut.decimals
            )
          : swap.amount;

      const expectedAmountIn = BigNumber.from(inputAmount);
      const maxAmountIn =
        tradeType === TradeType.EXACT_INPUT
          ? expectedAmountIn
          : addMarkupToAmount(expectedAmountIn, swap.slippageTolerance / 100);
      const expectedAmountOut = BigNumber.from(outputAmount);
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
        swapTx: {
          to: "0x0",
          data: "0x0",
          value: "0x0",
        },
      };
    }

    getLogger().debug({
      at: "uniswap/swap-router-02/fetchFn",
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
    getRouter,
    getOriginEntryPoints,
    fetchFn,
  };
}

export function buildSwapRouterSwapTx(
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
    to: SWAP_ROUTER_02_ADDRESS[swap.chainId],
  };
}

export function indicativeQuotePriceCache(swap: Swap, tradeType: TradeType) {
  // TODO: Add price buckets based on USD value, e.g. 100, 1000, 10000
  const cacheKey = buildCacheKey(
    "uniswap-indicative-quote",
    tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
    swap.chainId,
    swap.tokenIn.symbol,
    swap.tokenOut.symbol
  );
  const ttl = 60;
  const fetchFn = async () => {
    const quote = await getUniswapClassicIndicativeQuoteFromApi(
      { ...swap, swapper: swap.recipient },
      tradeType
    );
    const pricePerTokenOut =
      Number(
        ethers.utils.formatUnits(quote.input.amount, swap.tokenIn.decimals)
      ) /
      Number(
        ethers.utils.formatUnits(quote.output.amount, swap.tokenOut.decimals)
      );
    return pricePerTokenOut;
  };
  return makeCacheGetterAndSetter(cacheKey, ttl, fetchFn);
}
