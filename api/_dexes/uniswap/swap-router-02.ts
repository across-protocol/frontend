import { BigNumber, ethers } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import { SwapRouter } from "@uniswap/router-sdk";

import {
  getLogger,
  getSpokePoolAddress,
  addMarkupToAmount,
} from "../../_utils";
import { QuoteFetchStrategy, Swap, SwapQuote } from "../types";
import {
  getSpokePoolPeripheryAddress,
  getSpokePoolPeripheryProxyAddress,
} from "../../_spoke-pool-periphery";
import { getUniversalSwapAndBridgeAddress } from "../../_swap-and-bridge";
import { floatToPercent } from "./utils/conversion";
import {
  getUniswapClassicQuoteFromApi,
  getUniswapClassicIndicativeQuoteFromApi,
  UniswapClassicQuoteFromApi,
} from "./utils/trading-api";
import { RouterTradeAdapter } from "./utils/adapter";
import { buildCacheKey, makeCacheGetterAndSetter } from "../../_cache";
import { SWAP_ROUTER_02_ADDRESS } from "./utils/addresses";
import {
  getUniswapQuoteWithSwapQuoterFromSdk,
  getUniswapQuoteWithSwapRouter02FromSdk,
} from "./utils/v3-sdk";

type QuoteSource = "trading-api" | "sdk-swap-quoter" | "sdk-alpha-router";

export function getSwapRouter02Strategy(
  originSwapEntryPointContractName:
    | "SpokePoolPeriphery"
    | "SpokePoolPeripheryProxy"
    | "UniversalSwapAndBridge",
  quoteSource: QuoteSource = "trading-api"
): QuoteFetchStrategy {
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

    if (quoteSource === "trading-api") {
      swapQuote = await fetchViaTradingApi(swap, tradeType, opts);
    } else if (["sdk-swap-quoter", "sdk-alpha-router"].includes(quoteSource)) {
      swapQuote = await fetchViaSdk(swap, tradeType, opts, quoteSource);
    } else {
      throw new Error(`Cannot fetch quote from unknown source: ${quoteSource}`);
    }

    getLogger().debug({
      at: "uniswap/swap-router-02/fetchFn",
      message: "Swap quote",
      quoteSource,
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

async function fetchViaSdk(
  swap: Swap,
  tradeType: TradeType,
  opts: Partial<{
    useIndicativeQuote: boolean;
  }> = {
    useIndicativeQuote: false,
  },
  quoteSource: QuoteSource = "sdk-alpha-router"
) {
  let swapQuote: SwapQuote;
  if (opts.useIndicativeQuote) {
    const indicativeQuotePricePerTokenOut = await indicativeQuotePriceCache(
      swap,
      tradeType,
      quoteSource
    ).get();
    swapQuote = buildIndicativeQuote(
      swap,
      tradeType,
      indicativeQuotePricePerTokenOut
    );
  } else {
    if (quoteSource === "sdk-swap-quoter") {
      swapQuote = await getUniswapQuoteWithSwapQuoterFromSdk(swap, tradeType);
    } else {
      swapQuote = await getUniswapQuoteWithSwapRouter02FromSdk(swap, tradeType);
    }
  }
  return swapQuote;
}

async function fetchViaTradingApi(
  swap: Swap,
  tradeType: TradeType,
  opts: Partial<{
    useIndicativeQuote: boolean;
  }> = {
    useIndicativeQuote: false,
  }
) {
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
      swapTxns: [swapTx],
    };
  } else {
    const indicativeQuotePricePerTokenOut = await indicativeQuotePriceCache(
      swap,
      tradeType,
      "trading-api"
    ).get();
    swapQuote = buildIndicativeQuote(
      swap,
      tradeType,
      indicativeQuotePricePerTokenOut
    );
  }
  return swapQuote;
}

function buildSwapRouterSwapTx(
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

function buildIndicativeQuote(
  swap: Swap,
  tradeType: TradeType,
  indicativeQuotePricePerTokenOut: number
) {
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
          (indicativeQuotePricePerTokenOut === 0
            ? 0
            : Number(
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

  const swapQuote = {
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    maximumAmountIn: maxAmountIn,
    minAmountOut,
    expectedAmountOut,
    expectedAmountIn,
    slippageTolerance: swap.slippageTolerance,
    swapTxns: [
      {
        to: "0x0",
        data: "0x0",
        value: "0x0",
      },
    ],
  };

  return swapQuote;
}

function indicativeQuotePriceCache(
  swap: Swap,
  tradeType: TradeType,
  quoteSource: QuoteSource = "trading-api"
) {
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
    let inputAmount: BigNumber;
    let outputAmount: BigNumber;
    if (quoteSource === "trading-api") {
      const quote = await getUniswapClassicIndicativeQuoteFromApi(
        { ...swap, swapper: swap.recipient },
        tradeType
      );
      inputAmount = BigNumber.from(quote.input.amount);
      outputAmount = BigNumber.from(quote.output.amount);
    } else if (quoteSource === "sdk-alpha-router") {
      const swapQuote = await getUniswapQuoteWithSwapRouter02FromSdk(
        swap,
        tradeType
      );
      inputAmount = swapQuote.expectedAmountIn;
      outputAmount = swapQuote.expectedAmountOut;
    } else if (quoteSource === "sdk-swap-quoter") {
      const swapQuote = await getUniswapQuoteWithSwapQuoterFromSdk(
        swap,
        tradeType
      );
      inputAmount = swapQuote.expectedAmountIn;
      outputAmount = swapQuote.expectedAmountOut;
    } else {
      throw new Error(
        `Cannot fetch indicative quote from unknown source: ${quoteSource}`
      );
    }

    const inputAmountFormatted = Number(
      ethers.utils.formatUnits(inputAmount, swap.tokenIn.decimals)
    );
    const outputAmountFormatted = Number(
      ethers.utils.formatUnits(outputAmount, swap.tokenOut.decimals)
    );

    if (outputAmountFormatted === 0) {
      return 0;
    }

    const pricePerTokenOut = inputAmountFormatted / outputAmountFormatted;
    return pricePerTokenOut;
  };
  return makeCacheGetterAndSetter(cacheKey, ttl, fetchFn);
}
