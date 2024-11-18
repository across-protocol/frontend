import { BigNumber } from "ethers";
import { getSuggestedFees } from "../_utils";
import { AmountType, CrossSwapType } from "./cross-swap";

export type { AmountType, CrossSwapType };

export type Token = {
  address: string;
  decimals: number;
  symbol: string;
  chainId: number;
};

export type Swap = {
  chainId: number;
  tokenIn: Token;
  tokenOut: Token;
  amount: string;
  recipient: string;
  slippageTolerance: number;
  type: AmountType;
};

export type CrossSwap = {
  amount: BigNumber;
  inputToken: Token;
  outputToken: Token;
  recipient: string;
  slippageTolerance: number;
  type: AmountType;
  refundOnOrigin: boolean;
  refundAddress?: string;
};

export type SupportedDex = "1inch" | "uniswap";

export type OriginSwapQuoteAndCalldata = {
  minExpectedInputTokenAmount: string;
  routerCalldata: string;
  value: string;
  swapAndBridgeAddress: string;
  dex: SupportedDex;
  slippage: number;
};

export type SwapQuote = {
  maximumAmountIn: BigNumber;
  minAmountOut: BigNumber;
  expectedAmountOut: BigNumber;
  expectedAmountIn: BigNumber;
  slippageTolerance: number;
  swapTx: {
    to: string;
    data: string;
    value: string;
  };
  tokenIn: Token;
  tokenOut: Token;
};

export type CrossSwapQuotes = {
  crossSwap: CrossSwap;
  bridgeQuote: {
    message?: string;
    inputToken: Token;
    outputToken: Token;
    inputAmount: BigNumber;
    outputAmount: BigNumber;
    minOutputAmount: BigNumber;
    suggestedFees: Awaited<ReturnType<typeof getSuggestedFees>>;
  };
  destinationSwapQuote?: SwapQuote;
  originSwapQuote?: SwapQuote;
};
