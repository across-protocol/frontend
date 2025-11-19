import { BigNumber } from "ethers";
import { Address } from "@solana/kit";
import { TradeType } from "@uniswap/sdk-core";

import { getSuggestedFees } from "../_utils";
import { AmountType, AppFee, CrossSwapType } from "./utils";
import { Action } from "../swap/_utils";
import { TransferType } from "../_spoke-pool-periphery";

export enum FeeDetailsType {
  TOTAL_BREAKDOWN = "total-breakdown",
  MAX_TOTAL_BREAKDOWN = "max-total-breakdown",
  ACROSS = "across",
}

export type SlippageTolerance = number | "auto";

export type OriginOrDestination = "origin" | "destination";

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
  slippageTolerance: SlippageTolerance;
  type: AmountType;
  isInputNative?: boolean;
  isOutputNative?: boolean;
  originOrDestination: OriginOrDestination;
};

export type CrossSwap = {
  amount: BigNumber;
  inputToken: Token;
  outputToken: Token;
  depositor: string;
  recipient: string;
  slippageTolerance: SlippageTolerance;
  type: AmountType;
  refundOnOrigin: boolean;
  refundAddress?: string;
  isInputNative?: boolean;
  isOutputNative?: boolean;
  excludeSources?: string[];
  includeSources?: string[];
  embeddedActions: Action[];
  appFeePercent?: number;
  appFeeRecipient?: string;
  strictTradeType: boolean;
  isDestinationSvm?: boolean;
  isOriginSvm?: boolean;
};

export type SupportedDex =
  | "1inch"
  | "uniswap"
  | "uniswap-v3/swap-router-02"
  | "uniswap/universal-router-02"
  | "gho-multicall3"
  | "wrapped-gho"
  | "lifi"
  | "0x"
  | "jupiter";

export type OriginSwapQuoteAndCalldata = {
  minExpectedInputTokenAmount: string;
  routerCalldata: string;
  value: string;
  swapAndBridgeAddress: string;
  dex: SupportedDex;
  slippage: number;
};

export type EvmSwapTxn = {
  ecosystem: "evm";
  to: string;
  data: string;
  value: string;
};

export type SvmSwapTxn = {
  ecosystem: "svm";
  to: string;
  instructions?: Record<string, unknown>;
  lookupTables?: Address[];
};

export type SwapTxn = EvmSwapTxn | SvmSwapTxn;

export function isEvmSwapTxn(swapTxn: SwapTxn): swapTxn is EvmSwapTxn {
  return swapTxn.ecosystem === "evm";
}

export function isSvmSwapTxn(swapTxn: SwapTxn): swapTxn is SvmSwapTxn {
  return swapTxn.ecosystem === "svm";
}

export type SwapQuote = {
  maximumAmountIn: BigNumber;
  minAmountOut: BigNumber;
  expectedAmountOut: BigNumber;
  expectedAmountIn: BigNumber;
  slippageTolerance: number;
  swapTxns: (EvmSwapTxn | SvmSwapTxn)[];
  tokenIn: Token;
  tokenOut: Token;
  swapProvider: {
    name: string;
    sources: string[];
  };
};

type AcrossBridgeFeeDetails = {
  type: FeeDetailsType.ACROSS;
  lp: FeeComponent;
  relayerCapital: FeeComponent;
  destinationGas: FeeComponent;
};

type FeeComponent = {
  amount: BigNumber;
  pct: BigNumber;
  token: Token;
  details?: AcrossBridgeFeeDetails;
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
    estimatedFillTimeSec: number;
    fees: FeeComponent;
  } & (
    | {
        provider: "across";
        suggestedFees: Awaited<ReturnType<typeof getSuggestedFees>>;
      }
    | {
        provider: "hypercore" | "cctp" | "oft" | "sponsored-intent";
      }
  );
  destinationSwapQuote?: SwapQuote;
  originSwapQuote?: SwapQuote;
  contracts: {
    depositEntryPoint: DepositEntryPointContract;
    originRouter?: RouterContract;
    destinationRouter?: RouterContract;
    originSwapEntryPoint?: OriginSwapEntryPointContract;
  };
  appFee?: AppFee;
  indirectDestinationRoute?: IndirectDestinationRoute;
};

export type OriginSwapEntryPointContract = {
  name: "UniversalSwapAndBridge" | "SpokePoolPeriphery" | "SvmSpoke";
  address: string;
  dex?: SupportedDex;
};

export type DepositEntryPointContract = {
  name: "SpokePoolPeriphery" | "SpokePool" | "SvmSpoke";
  address: string;
};
export type RouterContract = {
  name: string;
  address: string;
  transferType?: TransferType;
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
      sourcesNames: string[];
      sourcesType: "exclude" | "include";
    }
  | undefined;

export type AssertSellEntireBalanceSupportedFn = () => void;

export type QuoteFetchStrategy = {
  strategyName: string;
  getRouter: (chainId: number) => {
    address: string;
    name: string;
    transferType?: TransferType;
  };
  getOriginEntryPoints: (chainId: number) => OriginEntryPoints;
  fetchFn: QuoteFetchFn;
  getSources: GetSourcesFn;
  assertSellEntireBalanceSupported: AssertSellEntireBalanceSupportedFn;
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
  sources: ReturnType<GetSourcesFn>;
  sellEntireBalance: boolean;
  throwIfSellEntireBalanceUnsupported: boolean;
  quoteBuffer: number;
  splitSlippage: boolean;
}>;

export type OriginEntryPointContractName =
  | "SpokePoolPeriphery"
  | "UniversalSwapAndBridge"
  | "SvmSpoke";

export type OriginEntryPoints = {
  originSwapInitialRecipient: {
    name: "UniversalSwapAndBridge" | "SwapProxy" | "SvmSpoke";
    address: string;
  };
  swapAndBridge: OriginSwapEntryPointContract;
  deposit: {
    name: "SpokePoolPeriphery" | "SpokePool" | "SvmSpoke";
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
    slippageTolerance: SlippageTolerance;
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
    slippageTolerance: SlippageTolerance;
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
    slippageTolerance: SlippageTolerance;
    type: AmountType;
  };
  destinationSwap: {
    chainId: number;
    tokenIn: Token;
    tokenOut: Token;
    recipient: string;
    slippageTolerance: SlippageTolerance;
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

export type IndirectDestinationRoute = {
  inputToken: Token;
  intermediaryOutputToken: Token;
  outputToken: Token;
};
