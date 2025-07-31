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
import { LIFI_ROUTER_ADDRESS } from "./utils/addresses";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";
import { SOURCES } from "./utils/sources";
import { compactAxiosError, SwapQuoteUnavailableError } from "../../_errors";

const { API_KEY_LIFI } = getEnvs();

const API_BASE_URL = "https://li.quest/v1";

const API_HEADERS = {
  "Content-Type": "application/json",
  ...(API_KEY_LIFI ? { "x-lifi-api-key": `${API_KEY_LIFI}` } : {}),
};

export function getLifiStrategy(
  originSwapEntryPointContractName: OriginEntryPointContractName
): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    const address = LIFI_ROUTER_ADDRESS[chainId];
    if (!address) {
      throw new Error(`LI.FI router address not found for chain id ${chainId}`);
    }
    return {
      address,
      name: "LifiRouter",
    };
  };

  const getOriginEntryPoints = (chainId: number) =>
    getOriginSwapEntryPoints(originSwapEntryPointContractName, chainId, "lifi");

  const getSources = makeGetSources(SOURCES);

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts?: QuoteFetchOpts
  ) => {
    try {
      const sources = opts?.sources;
      const sourcesParams =
        sources?.sourcesType === "exclude"
          ? {
              denyExchanges: sources.sourcesKeys,
            }
          : sources?.sourcesType === "include"
            ? {
                allowExchanges: sources.sourcesKeys,
              }
            : {};

      const params = {
        fromChain: swap.chainId,
        toChain: swap.chainId,
        fromToken: swap.tokenIn.address,
        toToken: swap.tokenOut.address,
        fromAddress: swap.recipient,
        skipSimulation: true,
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
            to: "0x0",
            data: "0x0",
            value: "0x0",
          }
        : {
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
          name: "lifi",
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
      if (error instanceof AxiosError) {
        if (
          error.response?.status === 404 &&
          error.response?.data.message.includes("No available quotes")
        ) {
          throw new SwapQuoteUnavailableError(
            {
              message: "No available quotes from LI.FI",
            },
            {
              cause: error,
            }
          );
        }
      }
      throw error;
    }
  };

  return {
    strategyName: "lifi",
    getRouter,
    getOriginEntryPoints,
    fetchFn,
    getSources,
  };
}
