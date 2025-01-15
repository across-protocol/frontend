import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { Percent } from "@uniswap/sdk-core";

import { Token, QuoteFetchStrategy } from "../types";

export type UniswapQuoteFetchStrategy = QuoteFetchStrategy;

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

export function floatToPercent(value: number) {
  return new Percent(
    // max. slippage decimals is 2
    Number(value.toFixed(2)) * 100,
    10_000
  );
}