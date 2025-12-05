import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import axios, { AxiosError } from "axios";

import { addMarkupToAmount, getLogger } from "../../_utils";
import {
  OriginEntryPointContractName,
  QuoteFetchOpts,
  QuoteFetchStrategy,
  Swap,
  SwapQuote,
} from "../types";
import { ALLOWANCE_HOLDER_ADDRESS } from "./utils/addresses";
import { getEnvs } from "../../_env";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";
import { SOURCES } from "./utils/sources";
import {
  compactAxiosError,
  UpstreamSwapProviderError,
  UPSTREAM_SWAP_PROVIDER_ERRORS,
} from "../../_errors";
import { estimateInputForExactOutput } from "./utils/utils";
import { getSlippage } from "../../_slippage";

const { API_KEY_0X } = getEnvs();

export const API_BASE_URL = "https://api.0x.org/swap/allowance-holder";

export const API_HEADERS = {
  "Content-Type": "application/json",
  "0x-api-key": `${API_KEY_0X}`,
  "0x-version": "v2",
};

const SWAP_PROVIDER_NAME = "0x";

export function get0xStrategy(
  originSwapEntryPointContractName: OriginEntryPointContractName
): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    const address = ALLOWANCE_HOLDER_ADDRESS[chainId];
    if (!address) {
      throw new Error(
        `AllowanceHolder address not found for chain id ${chainId}`
      );
    }
    return {
      address,
      name: "AllowanceHolder",
    };
  };

  const getOriginEntryPoints = (chainId: number) =>
    getOriginSwapEntryPoints(originSwapEntryPointContractName, chainId, "0x");

  const getSources = makeGetSources(SOURCES);

  const assertSellEntireBalanceSupported = () => {
    return;
  };

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts?: QuoteFetchOpts
  ) => {
    try {
      const slippageTolerance = getSlippage({
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        slippageTolerance: swap.slippageTolerance,
        originOrDestination: swap.originOrDestination,
        splitSlippage: opts?.splitSlippage,
      });
      let initialSwapAmount = swap.amount;

      if (opts?.sellEntireBalance) {
        swap.amount = addMarkupToAmount(
          BigNumber.from(swap.amount),
          slippageTolerance / 100
        ).toString();
      }
      let swapAmount = swap.amount;
      const sources = opts?.sources;
      const sourcesParams: Record<string, string> | undefined =
        sources?.sourcesType === "exclude"
          ? {
              excludedSources: sources.sourcesKeys.join(","),
            }
          : // We need to invert the include sources to be compatible with the API
            // because 0x doesn't support the `includeSources` parameter
            sources?.sourcesType === "include" &&
              sources.sourcesNames?.length > 0
            ? {
                excludedSources: SOURCES.sources[swap.chainId]
                  .filter(
                    ({ key }) =>
                      !sources.sourcesKeys.some(
                        (sourceKey) => key === sourceKey
                      )
                  )
                  .map(({ key }) => key)
                  .join(","),
              }
            : undefined;

      if (tradeType === TradeType.EXACT_OUTPUT) {
        swapAmount = await estimateInputForExactOutput(
          swap,
          API_BASE_URL,
          API_HEADERS,
          SWAP_PROVIDER_NAME,
          sourcesParams
        );
        initialSwapAmount = swapAmount;
      }

      // https://0x.org/docs/api#tag/Swap/operation/swap::allowanceHolder::getQuote
      const response = await axios.get(
        `${API_BASE_URL}/${opts?.useIndicativeQuote ? "price" : "quote"}`,
        {
          headers: API_HEADERS,
          params: {
            chainId: swap.chainId,
            sellToken: swap.tokenIn.address,
            buyToken: swap.tokenOut.address,
            sellAmount: swapAmount,
            taker: swap.recipient,
            slippageBps: Math.round(slippageTolerance * 100), // needs to be an integer
            sellEntireBalance: opts?.sellEntireBalance,
            ...sourcesParams,
          },
        }
      );

      const quote = response.data;

      if (!quote.liquidityAvailable) {
        throw new UpstreamSwapProviderError({
          message: `0x: No liquidity available for ${
            swap.tokenIn.symbol
          } -> ${swap.tokenOut.symbol} on chain ${swap.chainId}`,
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.INSUFFICIENT_LIQUIDITY,
          swapProvider: "0x",
        });
      }

      const usedSources: string[] = Array.from(
        new Set(
          quote.route.fills.map((fill: { source: string }) =>
            fill.source.toLowerCase()
          )
        )
      );

      if (
        sources?.sourcesType === "include" &&
        sources.sourcesNames?.length > 0 &&
        !usedSources.every((source: string) =>
          sources.sourcesNames?.includes(source)
        )
      ) {
        throw new UpstreamSwapProviderError({
          message: `0x: Used sources ${usedSources.join(
            ", "
          )} do not match include sources ${sources.sourcesKeys.join(", ")}`,
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.NO_POSSIBLE_ROUTE,
          swapProvider: "0x",
        });
      }

      const expectedAmountIn = BigNumber.from(initialSwapAmount);
      const maximumAmountIn = BigNumber.from(quote.sellAmount);

      const expectedAmountOut = BigNumber.from(quote.buyAmount);
      const minAmountOut = BigNumber.from(quote.minBuyAmount);

      const swapTx = opts?.useIndicativeQuote
        ? {
            ecosystem: "evm" as const,
            to: "0x0",
            data: "0x0",
            value: "0x0",
          }
        : {
            ecosystem: "evm" as const,
            to: quote.transaction.to,
            data: quote.transaction.data,
            value: quote.transaction.value,
          };

      const swapQuote: SwapQuote = {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        maximumAmountIn,
        minAmountOut,
        expectedAmountOut,
        expectedAmountIn,
        slippageTolerance,
        swapTxns: [swapTx],
        swapProvider: {
          name: SWAP_PROVIDER_NAME,
          sources: usedSources,
        },
      };

      getLogger().debug({
        at: "0x/fetchFn",
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
        slippage: `${swapQuote.slippageTolerance}%`,
      });

      return swapQuote;
    } catch (error) {
      getLogger().debug({
        at: "0x/fetchFn",
        message: "Error fetching 0x quote",
        error: compactAxiosError(error as Error),
      });
      throw parse0xError(error);
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

// https://0x.org/docs/introduction/api-issues#swap-api
export function parse0xError(error: unknown) {
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
        "INPUT_INVALID",
        "SWAP_VALIDATION_FAILED",
        "TOKEN_NOT_SUPPORTED",
        "TAKER_NOT_AUTHORIZED_FOR_TRADE",
        "BUY_TOKEN_NOT_AUTHORIZED_FOR_TRADE",
        "SELL_TOKEN_NOT_AUTHORIZED_FOR_TRADE",
      ].includes(data.name)
    ) {
      return new UpstreamSwapProviderError(
        {
          message: data.message,
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.NO_POSSIBLE_ROUTE,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
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
