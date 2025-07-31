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
  excludeSources?: string[];
  includeSources?: string[];
};

export type SupportedDex =
  | "1inch"
  | "uniswap"
  | "uniswap-v3/swap-router-02"
  | "uniswap-v3/universal-router"
  | "gho"
  | "gho-multicall3"
  | "lifi"
  | "0x";

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
  swapProvider: {
    name: string;
    sources: string[];
  };
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

export type OriginSwapEntryPointContract = {
  name: "UniversalSwapAndBridge" | "SpokePoolPeriphery";
  address: string;
  dex?: SupportedDex;
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

export type GetSourcesFn = (
  chainId: number,
  opts?: {
    excludeSources?: string[];
    includeSources?: string[];
  }
) =>
  | {
      sourcesKeys: string[];
      sourcesType: "exclude" | "include";
    }
  | undefined;

export type QuoteFetchStrategy = {
  strategyName: string;
  getRouter: (chainId: number) => {
    address: string;
    name: string;
  };
  getOriginEntryPoints: (chainId: number) => OriginEntryPoints;
  fetchFn: QuoteFetchFn;
  getSources: GetSourcesFn;
};

export type SwapRouter = ReturnType<QuoteFetchStrategy["getRouter"]>;
export type OriginEntryPoint = ReturnType<
  QuoteFetchStrategy["getOriginEntryPoints"]
>;

export type QuoteFetchFn = (
  swap: Swap,
  tradeType: TradeType,
  opts?: QuoteFetchOpts
) => Promise<SwapQuote>;

export type QuoteFetchOpts = Partial<{
  useIndicativeQuote: boolean;
  sources?: ReturnType<GetSourcesFn>;
}>;

export type OriginEntryPointContractName =
  | "SpokePoolPeriphery"
  | "UniversalSwapAndBridge";

export type OriginEntryPoints = {
  originSwapInitialRecipient: {
    name: "UniversalSwapAndBridge" | "SwapProxy";
    address: string;
  };
  swapAndBridge: OriginSwapEntryPointContract;
  deposit: {
    name: "SpokePoolPeriphery" | "SpokePool";
    address: string;
  };
};
export type DepositEntryPoint = OriginEntryPoints["deposit"];

export type CrossSwapQuotesRetrievalB2AResult = {
  destinationSwap: {
    chainId: number;
    tokenIn: Token;
    tokenOut: Token;
    recipient: string;
    slippageTolerance: number;
    type: AmountType;
  };
  originRouter: SwapRouter;
  destinationRouter: SwapRouter;
  depositEntryPoint: DepositEntryPoint;
  bridgeableOutputToken: Token;
  destinationSwapChainId: number;
  destinationStrategy: QuoteFetchStrategy;
  originStrategy: QuoteFetchStrategy;
};

export type CrossSwapQuotesRetrievalA2BResult = {
  originSwap: {
    chainId: number;
    tokenIn: Token;
    tokenOut: Token;
    recipient: string;
    slippageTolerance: number;
    type: AmountType;
  };
  originStrategy: QuoteFetchStrategy;
  originSwapChainId: number;
  destinationChainId: number;
  bridgeableInputToken: Token;
  originSwapEntryPoint: OriginSwapEntryPointContract;
};

export type CrossSwapQuotesRetrievalA2AResult = {
  originSwap: {
    chainId: number;
    tokenIn: Token;
    tokenOut: Token;
    recipient: string;
    slippageTolerance: number;
    type: AmountType;
  };
  destinationSwap: {
    chainId: number;
    tokenIn: Token;
    tokenOut: Token;
    recipient: string;
    slippageTolerance: number;
    type: AmountType;
  };
  originStrategy: QuoteFetchStrategy;
  originSwapChainId: number;
  destinationSwapChainId: number;
  bridgeableInputToken: Token;
  bridgeableOutputToken: Token;
  originSwapEntryPoint: OriginSwapEntryPointContract;
  depositEntryPoint: DepositEntryPoint;
  originRouter: SwapRouter;
  destinationRouter: SwapRouter;
  destinationStrategy: QuoteFetchStrategy;
}[];

export type DexSources = {
  strategy: string;
  sources: {
    [chainId: number]: {
      key: string; // Source key used by the DEX API
      names: string[]; // Source names that match the key
    }[];
  };
};
