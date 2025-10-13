import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes, Token } from "../../_dexes/types";
import { AppFee } from "../../_dexes/utils";

const name = "sponsored-bridge";

const capabilities: BridgeCapabilities = {
  ecosystems: ["evm", "svm"],
  supports: {
    A2A: false,
    A2B: false,
    B2A: false,
    B2B: true,
    B2BI: false,
    crossChainMessage: false,
  },
};

/**
 * Sponsored bridge strategy
 */
export function getSponsoredBridgeStrategy(): BridgeStrategy {
  return {
    name,
    capabilities,

    originTxNeedsAllowance: true,

    getCrossSwapTypes: (params: {
      inputToken: Token;
      outputToken: Token;
      isInputNative: boolean;
      isOutputNative: boolean;
    }) => {
      throw new Error("TODO");
    },

    getBridgeQuoteRecipient: (crossSwap: CrossSwap) => {
      return crossSwap.recipient;
    },

    getBridgeQuoteMessage: (_crossSwap: CrossSwap, _appFee?: AppFee) => {
      return "0x";
    },

    getQuoteForExactInput: async ({
      inputToken,
      outputToken,
      exactInputAmount,
      recipient,
      message: _message,
    }: GetExactInputBridgeQuoteParams) => {
      throw new Error("TODO");
    },

    getQuoteForOutput: async ({
      inputToken,
      outputToken,
      minOutputAmount,
      forceExactOutput: _forceExactOutput,
      recipient,
      message: _message,
    }: GetOutputBridgeQuoteParams) => {
      throw new Error("TODO");
    },

    buildTxForAllowanceHolder: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string;
    }) => {
      throw new Error("TODO");
    },
  };
}
