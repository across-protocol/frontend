import { BigNumber, ethers } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import { SwapRouter } from "@uniswap/router-sdk";

import { getLogger, addMarkupToAmount } from "../../_utils";
import {
  OriginEntryPointContractName,
  QuoteFetchOpts,
  QuoteFetchStrategy,
  Swap,
  SwapQuote,
} from "../types";
import { floatToPercent } from "./utils/conversion";
import {
  getUniswapClassicQuoteFromApi,
  UniswapClassicQuoteFromApi,
} from "./utils/trading-api";
import { RouterTradeAdapter } from "./utils/adapter";
import { buildCacheKey, makeCacheGetterAndSetter } from "../../_cache";
import { SWAP_ROUTER_02_ADDRESS } from "./utils/addresses";
import {
  getUniswapQuoteWithSwapQuoterFromSdk,
  getUniswapQuoteWithSwapRouter02FromSdk,
} from "./utils/v3-sdk";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";
import {
  compactAxiosError,
  UPSTREAM_SWAP_PROVIDER_ERRORS,
  UpstreamSwapProviderError,
} from "../../_errors";
import { AxiosError } from "axios";
import { getSlippage } from "../../_slippage";

type QuoteSource = "trading-api" | "sdk-swap-quoter" | "sdk-alpha-router";

const STRATEGY_NAME = "uniswap-v3/swap-router-02";

export function getSwapRouter02Strategy(
  originSwapEntryPointContractName: OriginEntryPointContractName,
  quoteSource: QuoteSource = "trading-api"
): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    const address = SWAP_ROUTER_02_ADDRESS[chainId];
    if (!address) {
      throw new Error(
        `UniswapV3SwapRouter02 address not found for chain id ${chainId}`
      );
    }
    return {
      address: address,
      name: "UniswapV3SwapRouter02",
    };
  };

  const getOriginEntryPoints = (chainId: number) => {
    return getOriginSwapEntryPoints(
      originSwapEntryPointContractName,
      chainId,
      STRATEGY_NAME
    );
  };

  const getSources = makeGetSources({
    strategy: STRATEGY_NAME,
    sources: Object.keys(SWAP_ROUTER_02_ADDRESS).reduce(
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

  const assertSellEntireBalanceSupported = () => {
    throw new UpstreamSwapProviderError({
      message: `Option 'sellEntireBalance' is not supported by ${STRATEGY_NAME}`,
      code: UPSTREAM_SWAP_PROVIDER_ERRORS.SELL_ENTIRE_BALANCE_UNSUPPORTED,
      swapProvider: STRATEGY_NAME,
    });
  };

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts?: QuoteFetchOpts
  ) => {
    try {
      if (
        opts?.sellEntireBalance &&
        opts?.throwIfSellEntireBalanceUnsupported
      ) {
        assertSellEntireBalanceSupported();
      }

      let swapQuote: SwapQuote;

      if (quoteSource === "trading-api") {
        swapQuote = await fetchViaTradingApi(swap, tradeType, opts);
      } else if (
        ["sdk-swap-quoter", "sdk-alpha-router"].includes(quoteSource)
      ) {
        swapQuote = await fetchViaSdk(swap, tradeType, opts, quoteSource);
      } else {
        throw new Error(
          `Cannot fetch quote from unknown source: ${quoteSource}`
        );
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
    } catch (error) {
      getLogger().debug({
        at: "uniswap/swap-router-02/fetchFn",
        message: "Error fetching quote",
        error: compactAxiosError(error as Error),
      });
      throw parseUniswapError(error);
    }
  };

  return {
    strategyName: STRATEGY_NAME,
    getRouter,
    getOriginEntryPoints,
    getSources,
    fetchFn,
    assertSellEntireBalanceSupported,
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
      { ...swap, swapper: swap.recipient, protocols: ["V2", "V3"] },
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
      swapProvider: {
        name: "uniswap/api/swap-router-02",
        sources: ["uniswap_v3"],
      },
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
  const slippageTolerance = getSlippage({
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    slippageTolerance: swap.slippageTolerance,
  });

  const options = {
    recipient: swap.recipient,
    slippageTolerance: floatToPercent(slippageTolerance),
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
    ecosystem: "evm" as const,
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

  const slippageTolerance = getSlippage({
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    slippageTolerance: swap.slippageTolerance,
  });
  const expectedAmountIn = BigNumber.from(inputAmount);
  const maxAmountIn =
    tradeType === TradeType.EXACT_INPUT
      ? expectedAmountIn
      : addMarkupToAmount(expectedAmountIn, slippageTolerance / 100);
  const expectedAmountOut = BigNumber.from(outputAmount);
  const minAmountOut =
    tradeType === TradeType.EXACT_OUTPUT
      ? expectedAmountOut
      : addMarkupToAmount(expectedAmountOut, -slippageTolerance / 100);

  const swapQuote = {
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    maximumAmountIn: maxAmountIn,
    minAmountOut,
    expectedAmountOut,
    expectedAmountIn,
    slippageTolerance,
    swapTxns: [
      {
        ecosystem: "evm" as const,
        to: "0x0",
        data: "0x0",
        value: "0x0",
      },
    ],
    swapProvider: {
      name: "uniswap/api/swap-router-02",
      sources: ["uniswap_v3"],
    },
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
      const { quote } = await getUniswapClassicQuoteFromApi(
        { ...swap, swapper: swap.recipient, protocols: ["V2", "V3"] },
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

export function parseUniswapError(error: unknown) {
  if (error instanceof UpstreamSwapProviderError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const compactedError = compactAxiosError(error);

    if (!error.response?.data) {
      return new UpstreamSwapProviderError(
        {
          message: "Unknown error",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR,
          swapProvider: STRATEGY_NAME,
        },
        { cause: compactedError }
      );
    }

    const { data, status } = error.response;

    if (status >= 500) {
      return new UpstreamSwapProviderError(
        {
          message: "Service unavailable",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.SERVICE_UNAVAILABLE,
          swapProvider: STRATEGY_NAME,
        },
        { cause: compactedError }
      );
    }

    if (status >= 400) {
      return new UpstreamSwapProviderError(
        {
          message: data.message,
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.NO_POSSIBLE_ROUTE,
          swapProvider: STRATEGY_NAME,
        },
        { cause: compactedError }
      );
    }

    return new UpstreamSwapProviderError(
      {
        message: "Unknown error",
        code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR,
        swapProvider: STRATEGY_NAME,
      },
      { cause: compactedError }
    );
  }

  return new UpstreamSwapProviderError(
    {
      message: "Unknown error",
      code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR,
      swapProvider: STRATEGY_NAME,
    },
    { cause: error }
  );
}
