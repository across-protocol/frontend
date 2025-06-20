import { TradeType } from "@uniswap/sdk-core";
import axios, { AxiosError } from "axios";

import { Swap } from "../../types";
import { V2PoolInRoute, V3PoolInRoute } from "./adapter";
import { getMulticall3Address } from "../../../_utils";
import { CHAIN_IDs } from "../../../_constants";

export type UniswapClassicQuoteFromApi = {
  chainId: number;
  input: {
    amount: string;
    token: string;
  };
  output: {
    amount: string;
    token: string;
    recipient: string;
  };
  swapper: string;
  route: Array<(V3PoolInRoute | V2PoolInRoute)[]>;
  slippage: number;
  tradeType: "EXACT_OUTPUT" | "EXACT_INPUT";
  quoteId: string;
};

export type UniswapIndicativeQuoteFromApi = Awaited<
  ReturnType<typeof getUniswapClassicIndicativeQuoteFromApi>
>;

export type UniswapParamForApi = Omit<Swap, "type" | "slippageTolerance"> & {
  swapper: string;
  slippageTolerance?: number;
};

export const UNISWAP_TRADING_API_BASE_URL =
  process.env.UNISWAP_TRADING_API_BASE_URL ||
  "https://trade-api.gateway.uniswap.org/v1";

export const UNISWAP_API_KEY =
  process.env.UNISWAP_API_KEY || "JoyCGj29tT4pymvhaGciK4r1aIPvqW6W53xT1fwo";

/**
 * Based on https://uniswap-docs.readme.io/reference/aggregator_quote-1
 */
export async function getUniswapClassicQuoteFromApi(
  swap: UniswapParamForApi,
  tradeType: TradeType
) {
  // NOTE: Temporary fix Stablecoin Mainnet -> Lens. The Multicall3 address is currently blocked
  // by the Uniswap API. We use a dummy address for just fetching the quote.
  // TODO: Remove this once the Uniswap API is updated.
  const shouldUseDummySwapper =
    swap.tokenIn.chainId === CHAIN_IDs.MAINNET &&
    swap.swapper === getMulticall3Address(swap.tokenIn.chainId);
  const dummySwapperAddress = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

  const response = await axios.post<{
    requestId: string;
    routing: "CLASSIC";
    quote: UniswapClassicQuoteFromApi;
  }>(
    `${UNISWAP_TRADING_API_BASE_URL}/quote`,
    {
      type:
        tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
      tokenInChainId: swap.tokenIn.chainId,
      tokenOutChainId: swap.tokenOut.chainId,
      tokenIn: swap.tokenIn.address,
      tokenOut: swap.tokenOut.address,
      swapper: shouldUseDummySwapper ? dummySwapperAddress : swap.swapper,
      slippageTolerance: swap.slippageTolerance,
      autoSlippage: swap.slippageTolerance ? undefined : "DEFAULT",
      amount: swap.amount,
      urgency: "urgent",
      routingPreference: "CLASSIC",
    },
    {
      headers: {
        "x-api-key": UNISWAP_API_KEY,
      },
    }
  );
  const { quote } = response.data;
  return {
    ...response.data,
    quote: {
      ...quote,
      // Revert the dummy swapper address to the original swapper address.
      swapper: shouldUseDummySwapper ? swap.swapper : quote.swapper,
    },
  };
}

export async function getUniswapClassicIndicativeQuoteFromApi(
  swap: UniswapParamForApi,
  tradeType: TradeType,
  useFallback: boolean = true
) {
  try {
    const response = await axios.post<{
      requestId: string;
      input: {
        amount: string;
        chainId: number;
        token: string;
      };
      output: {
        amount: string;
        chainId: number;
        token: string;
      };
    }>(
      `${UNISWAP_TRADING_API_BASE_URL}/indicative_quote`,
      {
        type:
          tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
        amount: swap.amount,
        tokenInChainId: swap.tokenIn.chainId,
        tokenOutChainId: swap.tokenOut.chainId,
        tokenIn: swap.tokenIn.address,
        tokenOut: swap.tokenOut.address,
      },
      {
        headers: {
          "x-api-key": UNISWAP_API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      if (useFallback) {
        const { quote } = await getUniswapClassicQuoteFromApi(swap, tradeType);
        return quote;
      }
    }
    throw error;
  }
}

export async function getUniswapClassicCalldataFromApi(
  classicQuote: UniswapClassicQuoteFromApi
) {
  const response = await axios.post<{
    requestId: string;
    swap: {
      to: string;
      from: string;
      data: string;
      value: string;
      gasLimit: string;
      chainId: number;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      gasPrice: string;
    };
  }>(
    `${UNISWAP_TRADING_API_BASE_URL}/swap`,
    {
      quote: classicQuote,
      simulateTransaction: false,
      urgency: "urgent",
    },
    {
      headers: {
        "x-api-key": UNISWAP_API_KEY,
      },
    }
  );
  return response.data;
}
