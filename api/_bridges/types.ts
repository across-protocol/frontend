import { BigNumber } from "ethers";

import { CrossSwap, CrossSwapQuotes, Token } from "../_dexes/types";
import { AppFee, CrossSwapType } from "../_dexes/utils";

export type BridgeStrategiesConfig = {
  default: BridgeStrategy;
  fromToChains?: {
    [fromChainId: number]: {
      [toChainId: number]: BridgeStrategy;
    };
  };
  inputTokens?: {
    [inputTokenSymbol: string]: {
      [fromChainId: number]: {
        [toChainId: number]: BridgeStrategy;
      };
    };
  };
};

export type BridgeCapabilities = {
  ecosystems: ("evm" | "svm")[];
  supports: {
    A2A: boolean;
    A2B: boolean;
    B2A: boolean;
    B2B: boolean;
    B2BI?: boolean;
    crossChainMessage: boolean;
  };
};

export type BridgeContracts = {
  depositEntryPoint?: { name: string; address: string };
};

export type OriginTx =
  | {
      ecosystem: "evm";
      chainId: number;
      from: string;
      to: string;
      data: string;
      value?: BigNumber;
    }
  | {
      ecosystem: "svm";
      chainId: number;
      to: string;
      data: string;
    };

export type GetBridgeQuoteParams = {
  inputToken: Token;
  outputToken: Token;
  recipient?: string;
  message?: string;
};

export type GetExactInputBridgeQuoteParams = GetBridgeQuoteParams & {
  exactInputAmount: BigNumber;
};

export type GetOutputBridgeQuoteParams = GetBridgeQuoteParams & {
  minOutputAmount: BigNumber;
  forceExactOutput?: boolean;
};

export type BridgeStrategy = {
  name: string;
  capabilities: BridgeCapabilities;

  originTxNeedsAllowance?: boolean;

  getCrossSwapTypes: (params: {
    inputToken: Token;
    outputToken: Token;
    isInputNative: boolean;
    isOutputNative: boolean;
  }) => CrossSwapType[];

  getBridgeQuoteRecipient: (crossSwap: CrossSwap) => string;

  getBridgeQuoteMessage: (
    crossSwap: CrossSwap,
    appFee?: AppFee
  ) => string | undefined;

  getQuoteForExactInput: (params: GetExactInputBridgeQuoteParams) => Promise<{
    bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  }>;

  getQuoteForOutput: (params: GetOutputBridgeQuoteParams) => Promise<{
    bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  }>;

  buildTxForAllowanceHolder: (params: {
    quotes: CrossSwapQuotes;
    integratorId?: string;
  }) => Promise<OriginTx>;
};
