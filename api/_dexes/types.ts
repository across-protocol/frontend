import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";

import { getSuggestedFees } from "../_utils";
import { AmountType, CrossSwapType } from "./utils";

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
  depositor?: string;
  recipient: string;
  slippageTolerance: number;
  type: AmountType;
  isInputNative?: boolean;
  isOutputNative?: boolean;
};

export type CrossSwap = {
  amount: BigNumber;
  inputToken: Token;
  outputToken: Token;
  depositor: string;
  recipient: string;
  slippageTolerance: number;
  type: AmountType;
  refundOnOrigin: boolean;
  refundAddress?: string;
  isInputNative?: boolean;
  isOutputNative?: boolean;
};

export type SupportedDex = "1inch" | "uniswap" | "gho";

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
  swapTxns: {
    to: string;
    data: string;
    value: string;
  }[];
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
  contracts: {
    depositEntryPoint: DepositEntryPointContract;
    originRouter?: RouterContract;
    destinationRouter?: RouterContract;
    originSwapEntryPoint?: OriginSwapEntryPointContract;
  };
};

export type OriginSwapEntryPointContract =
  | {
      name: "SpokePoolPeripheryProxy" | "SpokePoolPeriphery";
      address: string;
    }
  | {
      name: "UniversalSwapAndBridge";
      address: string;
      dex: SupportedDex;
    };
export type DepositEntryPointContract = {
  name: "SpokePoolPeriphery" | "SpokePool";
  address: string;
};
export type RouterContract = {
  name: string;
  address: string;
};

export type CrossSwapQuotesWithFees = CrossSwapQuotes & {
  fees: CrossSwapFees;
};

export type CrossSwapFees = {
  bridgeFees: Record<string, number>;
  originSwapFees?: Record<string, number>;
  destinationSwapFees?: Record<string, number>;
};

export type QuoteFetchStrategy = {
  getRouter: (chainId: number) => {
    address: string;
    name: string;
  };
  getOriginEntryPoints: (chainId: number) => {
    swapAndBridge:
      | {
          name: "UniversalSwapAndBridge";
          address: string;
          dex: "uniswap" | "1inch" | "gho";
        }
      | {
          name: "SpokePoolPeripheryProxy" | "SpokePoolPeriphery";
          address: string;
        };
    deposit: {
      name: "SpokePoolPeriphery" | "SpokePool";
      address: string;
    };
  };
  fetchFn: QuoteFetchFn;
};

export type QuoteFetchFn = (
  swap: Swap,
  tradeType: TradeType,
  opts?: Partial<{
    useIndicativeQuote: boolean;
  }>
) => Promise<SwapQuote>;
