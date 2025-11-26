import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes } from "../../_dexes/types";
import { ConvertDecimals } from "../../_utils";
import { CROSS_SWAP_TYPE } from "../../_dexes/utils";
import { AppFee } from "../../_dexes/utils";
import { Token } from "../../_dexes/types";
import { getDepositMessage, isRouteSupported } from "./utils/common";
import { getUsdhIntentQuote } from "./utils/quote";
import { buildTxEvm, buildTxSvm } from "./utils/tx-builder";

const name = "sponsored-intent" as const;
const capabilities: BridgeCapabilities = {
  ecosystems: ["evm"],
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
 * This strategy is implements USDC -> USDH on HyperEVM/HyperCore via Across Intents.
 */
export function getUsdhIntentsBridgeStrategy(): BridgeStrategy {
  return {
    name,
    capabilities,

    getCrossSwapTypes: (params: {
      inputToken: Token;
      outputToken: Token;
      isInputNative: boolean;
      isOutputNative: boolean;
    }) => {
      if (
        isRouteSupported({
          inputToken: params.inputToken,
          outputToken: params.outputToken,
        })
      ) {
        return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE];
      }
      return [];
    },

    getBridgeQuoteRecipient: (crossSwap: CrossSwap) => {
      return crossSwap.recipient;
    },

    getBridgeQuoteMessage: (crossSwap: CrossSwap, _appFee?: AppFee) => {
      return getDepositMessage({
        outputToken: crossSwap.outputToken,
        recipient: crossSwap.recipient,
      });
    },

    getQuoteForExactInput: async ({
      inputToken,
      outputToken,
      exactInputAmount,
      recipient,
    }: GetExactInputBridgeQuoteParams) => {
      const bridgeQuote = await getUsdhIntentQuote({
        inputToken,
        outputToken,
        exactInputAmount,
        recipient,
      });
      return {
        bridgeQuote: {
          ...bridgeQuote,
          provider: name,
        },
      };
    },

    getQuoteForOutput: async ({
      inputToken,
      outputToken,
      minOutputAmount,
      recipient,
    }: GetOutputBridgeQuoteParams) => {
      const inputAmount = ConvertDecimals(
        outputToken.decimals,
        inputToken.decimals
      )(minOutputAmount);
      const bridgeQuote = await getUsdhIntentQuote({
        inputToken,
        outputToken,
        exactInputAmount: inputAmount,
        recipient,
      });
      return {
        bridgeQuote: {
          ...bridgeQuote,
          provider: name,
        },
      };
    },

    buildTxForAllowanceHolder: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string | undefined;
    }) => {
      if (params.quotes.crossSwap.isOriginSvm) {
        return buildTxSvm(params);
      } else {
        return buildTxEvm(params);
      }
    },

    isRouteSupported,
  };
}
