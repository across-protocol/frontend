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
  getSuggestedFees,
} from "../../_utils";
import { buildCrossSwapTxForAllowanceHolder } from "../../swap/approval/_utils";
import {
  getBridgeQuoteRecipient,
  getBridgeQuoteMessage,
  getCrossSwapTypes,
} from "../../_dexes/utils";
import { AppFee } from "../../_dexes/utils";
import { Token } from "../../_dexes/types";
import { SwapAmountTooLowForBridgeFeesError } from "../../_errors";
import { BigNumber } from "ethers";

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
  const extractFees = (
    feesFromApi: Awaited<ReturnType<typeof getSuggestedFees>>,
    bridgeFeesToken: Token
  ) => {
    const zeroBN = BigNumber.from(0);
    return {
      totalRelay: {
        total: BigNumber.from(feesFromApi.totalRelayFee.total),
        pct: BigNumber.from(feesFromApi.totalRelayFee.pct),
        token: bridgeFeesToken,
      },
      relayerCapital: {
        total: BigNumber.from(feesFromApi.relayerCapitalFee.total),
        pct: BigNumber.from(feesFromApi.relayerCapitalFee.pct),
        token: bridgeFeesToken,
      },
      relayerGas: {
        total: BigNumber.from(feesFromApi.relayerGasFee.total),
        pct: BigNumber.from(feesFromApi.relayerGasFee.pct),
        token: bridgeFeesToken,
      },
      lp: {
        total: BigNumber.from(feesFromApi.lpFee.total),
        pct: BigNumber.from(feesFromApi.lpFee.pct),
        token: bridgeFeesToken,
      },
      bridgeFee: {
        pct: zeroBN,
        total: zeroBN,
        token: bridgeFeesToken,
      },
    };
  };

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
      return getCrossSwapTypes({
        inputToken: params.inputToken.address,
        originChainId: params.inputToken.chainId,
        outputToken: params.outputToken.address,
        destinationChainId: params.outputToken.chainId,
        isInputNative: params.isInputNative,
        isOutputNative: params.isOutputNative,
      });
    },

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

      if (bridgeQuote.outputAmount.lt(0)) {
        throw new SwapAmountTooLowForBridgeFeesError({
          bridgeAmount: exactInputAmount.toString(),
          bridgeFee: bridgeQuote.suggestedFees.totalRelayFee.total.toString(),
        });
      }

      return {
        bridgeQuote: {
          ...bridgeQuote,
          estimatedFillTimeSec: bridgeQuote.suggestedFees.estimatedFillTimeSec,
          provider: name,
          fees: extractFees(bridgeQuote.suggestedFees, inputToken),
        },
      };
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
      return {
        bridgeQuote: {
          ...bridgeQuote,
          estimatedFillTimeSec: bridgeQuote.suggestedFees.estimatedFillTimeSec,
          provider: name,
          fees: extractFees(bridgeQuote.suggestedFees, inputToken),
        },
      };
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
