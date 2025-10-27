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

/**
 * Returns the slippage tolerance value. If the slippage tolerance is "auto",
 * the function will return the resolved auto slippage value. If the slippage tolerance
 * is a number, the function will return the slippage tolerance value.
 * @param params.tokenIn - The input token object.
 * @param params.tokenOut - The output token object
 * @param params.slippageTolerance - The slippage tolerance expressed as 0 <= slippage <= 100, where 1 = 1%.
 * @returns The slippage tolerance value expressed as 0 <= slippage <= 100, where 1 = 1%. Max. decimals is 2.
 */
export function getSlippage(params: {
  tokenIn: Token;
  tokenOut: Token;
  slippageTolerance: number | "auto";
}) {
  const resolvedSlippage =
    params.slippageTolerance === "auto"
      ? resolveAutoSlippage({
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
        })
      : params.slippageTolerance;
  const parsedSlippage = parseFloat(resolvedSlippage.toFixed(2));

  if (isNaN(parsedSlippage)) {
    throw new Error("Invalid slippage tolerance value");
  }

  if (parsedSlippage > 100) {
    throw new Error("Slippage tolerance value exceeds 100%");
  }

  if (parsedSlippage < 0) {
    throw new Error("Slippage tolerance value is less than 0%");
  }

  return parsedSlippage;
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
