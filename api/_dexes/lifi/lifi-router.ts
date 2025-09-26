import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import axios, { AxiosError } from "axios";

import { getLogger } from "../../_utils";
import {
  OriginEntryPointContractName,
  QuoteFetchOpts,
  QuoteFetchStrategy,
  Swap,
  SwapQuote,
} from "../types";
import { getEnvs } from "../../_env";
import { LIFI_DIAMOND_ADDRESS } from "./utils/addresses";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";
import { SOURCES } from "./utils/sources";
import {
  compactAxiosError,
  UPSTREAM_SWAP_PROVIDER_ERRORS,
  UpstreamSwapProviderError,
} from "../../_errors";

const { API_KEY_LIFI } = getEnvs();

const API_BASE_URL = "https://li.quest/v1";

const API_HEADERS = {
  "Content-Type": "application/json",
  ...(API_KEY_LIFI ? { "x-lifi-api-key": `${API_KEY_LIFI}` } : {}),
};

const SWAP_PROVIDER_NAME = "lifi";

export function getLifiStrategy(
  originSwapEntryPointContractName: OriginEntryPointContractName
): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    const address = LIFI_DIAMOND_ADDRESS[chainId];
    if (!address) {
      throw new Error(
        `'LiFiDiamond' address not found for chain id ${chainId}`
      );
    }
    return {
      address,
      name: "LiFiDiamond",
    };
  };

  const getOriginEntryPoints = (chainId: number) =>
    getOriginSwapEntryPoints(originSwapEntryPointContractName, chainId, "lifi");

  const getSources = makeGetSources(SOURCES);

  const assertSellEntireBalanceSupported = () => {
    throw new UpstreamSwapProviderError({
      message: "Option 'sellEntireBalance' is not supported by Li.Fi",
      code: UPSTREAM_SWAP_PROVIDER_ERRORS.SELL_ENTIRE_BALANCE_UNSUPPORTED,
      swapProvider: SWAP_PROVIDER_NAME,
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

      const sources = opts?.sources;
      const sourcesParams =
        sources?.sourcesType === "exclude"
          ? {
              denyExchanges: sources.sourcesKeys,
            }
          : sources?.sourcesType === "include" &&
              sources.sourcesKeys?.length > 0
            ? {
                allowExchanges: sources.sourcesKeys,
              }
            : {};

      // Improves latency as we care about speed. This configuration returns the first
      // available quote with 600ms delay.
      // See https://docs.li.fi/guides/integration-tips/latency#selecting-timing-strategies
      const swapStepTimingStrategies = "minWaitTime-600-2-300";

      const params = {
        fromChain: swap.chainId,
        toChain: swap.chainId,
        fromToken: swap.tokenIn.address,
        toToken: swap.tokenOut.address,
        fromAddress: swap.recipient,
        skipSimulation: true,
        swapStepTimingStrategies,
        slippage: Math.floor(swap.slippageTolerance / 100),
        ...(tradeType === TradeType.EXACT_INPUT
          ? { fromAmount: swap.amount }
          : { toAmount: swap.amount }),
        ...sourcesParams,
      };

      // https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer
      const response = await axios.get(
        `${API_BASE_URL}/quote/${tradeType === TradeType.EXACT_INPUT ? "" : "toAmount"}`,
        {
          headers: API_HEADERS,
          params,
        }
      );

      const quote = response.data;

      const expectedAmountIn = BigNumber.from(quote.estimate.fromAmount);
      const maximumAmountIn = expectedAmountIn;

      const expectedAmountOut = BigNumber.from(quote.estimate.toAmount);
      const minAmountOut = BigNumber.from(quote.estimate.toAmountMin);

      const swapTx = opts?.useIndicativeQuote
        ? {
            ecosystem: "evm" as const,
            to: "0x0",
            data: "0x0",
            value: "0x0",
          }
        : {
            ecosystem: "evm" as const,
            to: quote.transactionRequest.to,
            data: quote.transactionRequest.data,
            value: quote.transactionRequest.value,
          };

      const swapQuote: SwapQuote = {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        maximumAmountIn,
        minAmountOut,
        expectedAmountOut,
        expectedAmountIn,
        slippageTolerance: swap.slippageTolerance,
        swapTxns: [swapTx],
        swapProvider: {
          name: SWAP_PROVIDER_NAME,
          sources: [quote.tool],
        },
      };

      getLogger().debug({
        at: "lifi/fetchFn",
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
    } catch (error) {
      getLogger().debug({
        at: "lifi/fetchFn",
        message: "Error fetching LI.FI quote",
        error: compactAxiosError(error as Error),
      });
      throw parseLiFiError(error);
    }
  };

  return {
    strategyName: SWAP_PROVIDER_NAME,
    getRouter,
    getOriginEntryPoints,
    fetchFn,
    getSources,
    assertSellEntireBalanceSupported,
  };
}

// https://docs.li.fi/api-reference/error-codes
export function parseLiFiError(error: unknown) {
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
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
      );
    }

    const { data, status } = error.response;

    if (
      [
        1002, // NoQuoteError
        1003, // NotFoundError
      ].includes(data.code)
    ) {
      return new UpstreamSwapProviderError(
        {
          message: data.message,
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.NO_POSSIBLE_ROUTE,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        {
          cause: compactedError,
        }
      );
    }

    if (status >= 500) {
      return new UpstreamSwapProviderError(
        {
          message: "Service unavailable",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.SERVICE_UNAVAILABLE,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
      );
    }

    return new UpstreamSwapProviderError(
      {
        message: "Unknown error",
        code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR,
        swapProvider: SWAP_PROVIDER_NAME,
      },
      { cause: compactedError }
    );
  }

  return new UpstreamSwapProviderError(
    {
      message: "Unknown error",
      code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR,
      swapProvider: SWAP_PROVIDER_NAME,
    },
    { cause: error }
  );
}
