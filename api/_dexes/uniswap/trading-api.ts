import { TradeType } from "@uniswap/sdk-core";
import axios from "axios";

import { Swap } from "../types";

type UniswapClassicQuoteFromApi = {
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
  route: any[];
  slippage: number;
  tradeType: "EXACT_OUTPUT" | "EXACT_INPUT";
  quoteId: string;
};

export type UniswapParamForApi = Omit<Swap, "type" | "slippageTolerance"> & {
  swapper: string;
  slippageTolerance?: number;
};

export const UNISWAP_TRADING_API_BASE_URL =
  process.env.UNISWAP_TRADING_API_BASE_URL ||
  "https://trading-api-labs.interface.gateway.uniswap.org/v1";

export const UNISWAP_API_KEY =
  process.env.UNISWAP_API_KEY || "JoyCGj29tT4pymvhaGciK4r1aIPvqW6W53xT1fwo";

/**
 * Based on https://uniswap-docs.readme.io/reference/aggregator_quote-1
 */
export async function getUniswapClassicQuoteFromApi(
  swap: UniswapParamForApi,
  tradeType: TradeType
) {
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
      swapper: swap.swapper,
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
  return response.data;
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
