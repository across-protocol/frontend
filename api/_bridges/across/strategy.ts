import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes } from "../../_dexes/types";
import {
  getBridgeQuoteForExactInput,
  getBridgeQuoteForOutput,
} from "../../_utils";
import { buildCrossSwapTxForAllowanceHolder } from "../../swap/approval/_utils";
import {
  getBridgeQuoteRecipient,
  getBridgeQuoteMessage,
} from "../../_dexes/utils";
import { AppFee } from "../../_dexes/utils";

const name = "across";
const capabilities: BridgeCapabilities = {
  ecosystems: ["evm", "svm"],
  supports: {
    A2A: true,
    A2B: true,
    B2A: true,
    B2B: true,
    B2BI: true,
    crossChainMessage: true,
  },
};

export function getAcrossBridgeStrategy(): BridgeStrategy {
  return {
    name,
    capabilities,

    getBridgeQuoteRecipient: (crossSwap: CrossSwap) => {
      return getBridgeQuoteRecipient(crossSwap);
    },

    getBridgeQuoteMessage: (crossSwap: CrossSwap, appFee?: AppFee) => {
      return getBridgeQuoteMessage(crossSwap, appFee);
    },

    getQuoteForExactInput: async ({
      inputToken,
      outputToken,
      exactInputAmount,
      recipient,
      message,
    }: GetExactInputBridgeQuoteParams) => {
      const bridgeQuote = await getBridgeQuoteForExactInput({
        inputToken,
        outputToken,
        exactInputAmount,
        recipient,
        message,
      });
      return { bridgeQuote };
    },

    getQuoteForOutput: async ({
      inputToken,
      outputToken,
      minOutputAmount,
      forceExactOutput,
      recipient,
      message,
    }: GetOutputBridgeQuoteParams) => {
      const bridgeQuote = await getBridgeQuoteForOutput({
        inputToken,
        outputToken,
        minOutputAmount,
        recipient,
        message,
        forceExactOutput,
      });
      return { bridgeQuote };
    },

    buildTxForAllowanceHolder: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string | undefined;
    }) => {
      const tx = await buildCrossSwapTxForAllowanceHolder(
        params.quotes,
        params.integratorId
      );
      return tx;
    },
  };
}
