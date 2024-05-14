export type Token = {
  address: string;
  decimals: number;
  symbol: string;
  chainId: number;
};

/**
 * @property `swapToken` - Address of the token that will be swapped for acrossInputToken.
 * @property `acrossInputToken` - Address of the token that will be bridged via Across as the inputToken.
 * @property `swapTokenAmount` - The amount of swapToken to be swapped for acrossInputToken.
 * @property `slippage` - The slippage tolerance for the swap in decimals, e.g. 1 for 1%.
 */
export type AcrossSwap = {
  swapToken: Token;
  acrossInputToken: Token;
  swapTokenAmount: string;
  slippage: number;
};

export type SupportedDex = "1inch" | "uniswap";

export type SwapQuoteAndCalldata = {
  minExpectedInputTokenAmount: string;
  routerCalldata: string;
  value: string;
  swapAndBridgeAddress: string;
  dex: SupportedDex;
  slippage: number;
};
