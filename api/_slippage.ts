import {
  STABLE_COIN_SYMBOLS,
  TOKEN_SYMBOLS_MAP,
  CUSTOM_GAS_TOKENS,
} from "./_constants";
import { Token } from "./_dexes/types";

export const STABLE_COIN_SWAP_SLIPPAGE = 0.5; // 0.5%
export const MAJOR_PAIR_SLIPPAGE = 1.5; // 1.5%
export const LONG_TAIL_SLIPPAGE = 5; // 5%

const MAJOR_TOKEN_SYMBOLS_BY_CHAIN: {
  default: string[];
  [chainId: number]: string[];
} = {
  default: [
    TOKEN_SYMBOLS_MAP.ETH.symbol,
    TOKEN_SYMBOLS_MAP.WETH.symbol,
    TOKEN_SYMBOLS_MAP.WBTC.symbol,
  ],
  ...Object.entries(CUSTOM_GAS_TOKENS).reduce(
    (acc, [chainId, tokenSymbol]) => {
      acc[Number(chainId)] = [tokenSymbol];
      return acc;
    },
    {} as Record<number, string[]>
  ),
};

export function getSlippage(params: {
  tokenIn: Token;
  tokenOut: Token;
  slippageTolerance: number | "auto";
}) {
  if (params.slippageTolerance === "auto") {
    return resolveAutoSlippage({
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
    });
  }
  return params.slippageTolerance;
}

/**
 * Returns resolved auto slippage value expressed as 0 <= slippage <= 100, where 1 = 1%.
 * This function returns a value based on the token pair.
 */
function resolveAutoSlippage(params: { tokenIn: Token; tokenOut: Token }) {
  if (params.tokenIn.chainId !== params.tokenOut.chainId) {
    throw new Error(
      "Can't resolve auto slippage for tokens on different chains"
    );
  }

  const isStableCoinSwap =
    isStableCoinSymbol(params.tokenIn.symbol) &&
    isStableCoinSymbol(params.tokenOut.symbol);

  if (isStableCoinSwap) {
    return STABLE_COIN_SWAP_SLIPPAGE;
  }

  const isTokenInStableOrMajor =
    isStableCoinSymbol(params.tokenIn.symbol) ||
    isMajorTokenSymbol(params.tokenIn.symbol, params.tokenIn.chainId);
  const isTokenOutStableOrMajor =
    isStableCoinSymbol(params.tokenOut.symbol) ||
    isMajorTokenSymbol(params.tokenOut.symbol, params.tokenOut.chainId);

  if (isTokenInStableOrMajor && isTokenOutStableOrMajor) {
    return MAJOR_PAIR_SLIPPAGE;
  }

  return LONG_TAIL_SLIPPAGE;
}

function isStableCoinSymbol(symbol: string) {
  return STABLE_COIN_SYMBOLS.find(
    (stableCoinSymbol) =>
      stableCoinSymbol.toUpperCase() === symbol.toUpperCase()
  );
}

function isMajorTokenSymbol(symbol: string, chainId: number) {
  const majorTokenSymbols =
    MAJOR_TOKEN_SYMBOLS_BY_CHAIN[chainId] ||
    MAJOR_TOKEN_SYMBOLS_BY_CHAIN.default;
  return majorTokenSymbols.find(
    (majorTokenSymbol) =>
      majorTokenSymbol.toUpperCase() === symbol.toUpperCase()
  );
}
