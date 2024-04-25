type Token = {
  address: string;
  decimals: number;
  symbol: string;
  chainId: number;
};

/**
 * @property `depositor` - The address of the depositor.
 * @property `swapToken` - Address of the token that will be swapped for acrossInputToken.
 * @property `acrossInputToken` - Address of the token that will be bridged via Across as the inputToken.
 * @property `swapTokenAmount` - The amount of swapToken to be swapped for acrossInputToken.
 */
export type AcrossSwap = {
  depositor: string;
  swapToken: Token;
  acrossInputToken: Token;
  swapTokenAmount: string;
};

export type SwapQuoteAndCalldata = {
  minExpectedInputTokenAmount: string;
  routerCalldata: string;
  value: string;
  swapAndBridgeAddress: string;
  dex: string;
};
