import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { Percent, TradeType } from "@uniswap/sdk-core";
import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { utils } from "@across-protocol/sdk";

import { Swap, SwapQuote, Token } from "../types";

export type UniswapQuoteFetchStrategy = {
  getRouterAddress: (chainId: number) => string;
  getPeripheryAddress: (chainId: number) => string;
  fetchFn: UniswapQuoteFetchFn;
};
export type UniswapQuoteFetchFn = (
  swap: Swap,
  tradeType: TradeType,
  opts?: Partial<{
    useIndicativeQuote: boolean;
  }>
) => Promise<SwapQuote>;

// Maps testnet chain IDs to their prod counterparts. Used to get the prod token
// info for testnet tokens.
const TESTNET_TO_PROD = {
  [CHAIN_IDs.SEPOLIA]: CHAIN_IDs.MAINNET,
  [CHAIN_IDs.BASE_SEPOLIA]: CHAIN_IDs.BASE,
  [CHAIN_IDs.OPTIMISM_SEPOLIA]: CHAIN_IDs.OPTIMISM,
  [CHAIN_IDs.ARBITRUM_SEPOLIA]: CHAIN_IDs.ARBITRUM,
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
  swap: Omit<Swap, "type"> & { swapper: string },
  tradeType: TradeType
) {
  const response = await axios.post(
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
      amount: swap.amount,
      routingPreference: "CLASSIC",
      urgency: "urgent",
    },
    {
      headers: {
        "x-api-key": UNISWAP_API_KEY,
      },
    }
  );
  return response.data as {
    requestId: string;
    routing: "CLASSIC";
    quote: {
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
  };
}

export function getProdToken(token: Token) {
  const prodChainId = TESTNET_TO_PROD[token.chainId] || token.chainId;

  const prodToken =
    TOKEN_SYMBOLS_MAP[token.symbol as keyof typeof TOKEN_SYMBOLS_MAP];
  const prodTokenAddress = prodToken?.addresses[prodChainId];

  if (!prodToken || !prodTokenAddress) {
    throw new Error(
      `Prod token not found for ${token.symbol} on chain ${token.chainId}`
    );
  }

  return {
    ...prodToken,
    chainId: prodChainId,
    address: prodTokenAddress,
  };
}

export function addMarkupToAmount(amount: BigNumber, markup = 0.01) {
  return amount
    .mul(ethers.utils.parseEther((1 + Number(markup)).toString()))
    .div(utils.fixedPointAdjustment);
}

export function floatToPercent(value: number) {
  return new Percent(
    // max. slippage decimals is 2
    Number(value.toFixed(2)) * 100,
    10_000
  );
}
