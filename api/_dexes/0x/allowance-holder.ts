import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import axios from "axios";

import { getLogger } from "../../_utils";
import {
  OriginEntryPointContractName,
  QuoteFetchOpts,
  QuoteFetchStrategy,
  Swap,
  SwapQuote,
} from "../types";
import { ALLOWANCE_HOLDER_ADDRESS } from "./utils/addresses";
import { getEnvs } from "../../_env";
import {
  estimateInputForExactOutput,
  getOriginSwapEntryPoints,
  makeGetSources,
} from "../utils";
import { SOURCES } from "./utils/sources";
import { compactAxiosError } from "../../_errors";

const { API_KEY_0X } = getEnvs();

const API_BASE_URL = "https://api.0x.org/swap/allowance-holder";

const API_HEADERS = {
  "Content-Type": "application/json",
  "0x-api-key": `${API_KEY_0X}`,
  "0x-version": "v2",
};

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

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts?: QuoteFetchOpts
  ) => {
    try {
      let swapAmount = swap.amount;
      if (tradeType === TradeType.EXACT_OUTPUT) {
        swapAmount = await estimateInputForExactOutput(
          swap,
          `${API_BASE_URL}/price`,
          API_HEADERS
        );
      }

      const sources = opts?.sources;
      const sourcesParams =
        sources?.sourcesType === "exclude"
          ? {
              excludeSources: sources.sourcesKeys.join(","),
            }
          : // We need to invert the include sources to be compatible with the API
            // because 0x doesn't support the `includeSources` parameter
            sources?.sourcesType === "include"
            ? {
                excludeSources: SOURCES.sources[swap.chainId]
                  .map((s) => s.key)
                  .filter(
                    (sourceKey) => !sources.sourcesKeys.includes(sourceKey)
                  ),
              }
            : {};

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
            slippageBps: Math.floor(swap.slippageTolerance * 100),
            ...sourcesParams,
          },
        }
      );

      const quote = response.data;

      if (!quote.liquidityAvailable) {
        throw new SwapQuoteUnavailableError({
          message: `0x: No liquidity available for ${
            swap.tokenIn.symbol
          } -> ${swap.tokenOut.symbol} on chain ${swap.chainId}`,
        });
      }

      const usedSources = quote.route.fills.map((fill: { source: string }) =>
        fill.source.toLowerCase()
      );

      const expectedAmountIn = BigNumber.from(quote.sellAmount);
      const maximumAmountIn = expectedAmountIn;

      const expectedAmountOut = BigNumber.from(quote.buyAmount);
      const minAmountOut = BigNumber.from(quote.minBuyAmount);

      const swapTx = opts?.useIndicativeQuote
        ? {
            to: "0x0",
            data: "0x0",
            value: "0x0",
          }
        : {
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
        slippageTolerance: swap.slippageTolerance,
        swapTxns: [swapTx],
        swapProvider: {
          name: "0x",
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
      });

      return swapQuote;
    } catch (error) {
      getLogger().debug({
        at: "0x/fetchFn",
        message: "Error fetching 0x quote",
        error: compactAxiosError(error as Error),
      });
      throw error;
    }
  };

  return {
    strategyName: "0x",
    getRouter,
    getOriginEntryPoints,
    fetchFn,
    getSources,
  };
}
