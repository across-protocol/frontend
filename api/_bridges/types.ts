import { BigNumber } from "ethers";

import { CrossSwap, CrossSwapQuotes, SwapQuote, Token } from "../_dexes/types";
import { AppFee, CrossSwapType } from "../_dexes/utils";
import { Logger } from "@across-protocol/sdk/dist/types/relayFeeCalculator";
import { getReceiveWithAuthTypedData } from "../_transfer-with-auth";
import type { SpokePoolPeripheryInterface } from "../_typechain/SpokePoolPeriphery.sol/SpokePoolPeriphery";
import { SponsoredGaslessRouteConfig } from "../_sponsored-gasless-config";

export type BridgeStrategiesConfig = {
  default: BridgeStrategy;
  tokenPairPerRoute?: {
    [originChainId: number]: {
      [destinationChainId: number]: {
        [inputToken: string]: {
          [outputToken: string]: BridgeStrategy;
        };
      };
    };
  };
  tokenPairPerToChain?: {
    [toChainId: number]: {
      [inputToken: string]: {
        [outputToken: string]: BridgeStrategy;
      };
    };
  };
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

export type OriginTx = ApprovalTx | GaslessTx;

export type ApprovalTx =
  | {
      isGasless?: false;
      ecosystem: "evm";
      chainId: number;
      from: string;
      to: string;
      data: string;
      value?: BigNumber;
    }
  | {
      isGasless?: false;
      ecosystem: "svm";
      chainId: number;
      to: string;
      data: string;
    };

export type Witness =
  | {
      type: "BridgeWitness";
      data: SpokePoolPeripheryInterface.DepositDataStruct;
    }
  | {
      type: "BridgeAndSwapWitness";
      data: SpokePoolPeripheryInterface.SwapAndDepositDataStruct;
    };

export type GaslessTx = {
  ecosystem: "evm-gasless";
  isGasless: true;
  data: {
    type: "erc3009";
    integratorId?: string;
    depositId: string;
    witness: Witness;
    permit: Awaited<ReturnType<typeof getReceiveWithAuthTypedData>>["eip712"];
    domainSeparator: string;
  };
  chainId: number;
  to: string;
};

export type GetBridgeQuoteParams = {
  inputToken: Token;
  outputToken: Token;
  recipient: string;
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

  getBridgeQuoteRecipient: (
    crossSwap: CrossSwap,
    hasOriginSwap?: boolean
  ) => Promise<string>;

  getBridgeQuoteMessage: (
    crossSwap: CrossSwap,
    appFee?: AppFee,
    originSwapQuote?: SwapQuote
  ) => Promise<string | undefined>;

  getQuoteForExactInput: (params: GetExactInputBridgeQuoteParams) => Promise<{
    bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  }>;

  getQuoteForOutput: (params: GetOutputBridgeQuoteParams) => Promise<{
    bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  }>;

  buildTxForAllowanceHolder: (params: {
    quotes: CrossSwapQuotes;
    integratorId?: string;
  }) => Promise<ApprovalTx>;

  buildGaslessTx?: (params: {
    quotes: CrossSwapQuotes;
    integratorId?: string;
    permitParams: {
      type: "erc3009";
      validAfter: number;
      validBefore: number;
    };
  }) => Promise<GaslessTx>;

  isRouteSupported: (params: {
    inputToken: Token;
    outputToken: Token;
  }) => boolean;
};

export type BridgeStrategyData =
  | {
      canFillInstantly: boolean;
      isUtilizationHigh: boolean;
      isUsdcToUsdc: boolean;
      isLargeCctpDeposit: boolean;
      isFastCctpEligible: boolean;
      isInThreshold: boolean;
      isUsdtToUsdt: boolean;
      isHyperCoreDestination: boolean;
      hasFastStandardFill: boolean;
    }
  | undefined;

export type BridgeStrategyDataParams = {
  inputToken: Token;
  outputToken: Token;
  amount: BigNumber;
  amountType: "exactInput" | "exactOutput" | "minOutput";
  includesActions?: boolean;
  includesAppFee?: boolean;
  recipient: string;
  depositor: string;
  logger?: Logger;
};

export type ApiKeyContext = {
  name?: string;
  permissions?: string[];
};

export type GetBridgeStrategyParams = {
  originChainId: number;
  destinationChainId: number;
  routingPreference?: string;
  sponsoredGaslessRoute?: SponsoredGaslessRouteConfig;
} & BridgeStrategyDataParams;

export type RoutingRule<TEligibilityData> = {
  name: string;
  shouldApply: (data: TEligibilityData) => boolean;
  getStrategy: (params?: BridgeStrategyDataParams) => BridgeStrategy | null;
  reason: string;
};

export type RouteStrategyFunction = (
  params: BridgeStrategyDataParams
) => Promise<BridgeStrategy | null>;
