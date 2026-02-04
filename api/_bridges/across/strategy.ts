import { BigNumber } from "ethers";
import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import {
  CrossSwap,
  CrossSwapQuotes,
  FeeDetailsType,
  SwapQuote,
  Token,
} from "../../_dexes/types";
import {
  getBridgeQuoteForExactInput,
  getBridgeQuoteForOutput,
  getSuggestedFees,
  ConvertDecimals,
} from "../../_utils";
import { buildCrossSwapTxForAllowanceHolder } from "../../swap/approval/_utils";
import {
  getBridgeQuoteRecipient,
  getBridgeQuoteMessage,
  getCrossSwapTypes,
  AppFee,
} from "../../_dexes/utils";
import { SwapAmountTooLowForBridgeFeesError } from "../../_errors";
import { buildErc3009Tx } from "./utils/erc3009-tx-builder";
import { getZeroBridgeFees } from "../utils";
import { SponsoredGaslessRouteConfig } from "../../_sponsored-gasless-config";

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

export function getAcrossBridgeStrategy(options?: {
  sponsoredGaslessRoute?: SponsoredGaslessRouteConfig;
}): BridgeStrategy {
  const sponsoredGaslessRoute = options?.sponsoredGaslessRoute ?? undefined;

  const extractFees = (
    feesFromApi: Awaited<ReturnType<typeof getSuggestedFees>>,
    bridgeFeesToken: Token
  ) => {
    return {
      amount: BigNumber.from(feesFromApi.totalRelayFee.total),
      pct: BigNumber.from(feesFromApi.totalRelayFee.pct),
      token: bridgeFeesToken,
      details: {
        type: FeeDetailsType.ACROSS,
        relayerCapital: {
          amount: BigNumber.from(feesFromApi.relayerCapitalFee.total),
          pct: BigNumber.from(feesFromApi.relayerCapitalFee.pct),
          token: bridgeFeesToken,
        },
        destinationGas: {
          amount: BigNumber.from(feesFromApi.relayerGasFee.total),
          pct: BigNumber.from(feesFromApi.relayerGasFee.pct),
          token: bridgeFeesToken,
        },
        lp: {
          amount: BigNumber.from(feesFromApi.lpFee.total),
          pct: BigNumber.from(feesFromApi.lpFee.pct),
          token: bridgeFeesToken,
        },
      },
    } as const;
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

    getBridgeQuoteRecipient: (
      crossSwap: CrossSwap,
      hasOriginSwap?: boolean
    ) => {
      return getBridgeQuoteRecipient(crossSwap, hasOriginSwap);
    },

    getBridgeQuoteMessage: (
      crossSwap: CrossSwap,
      appFee?: AppFee,
      originSwapQuote?: SwapQuote
    ) => {
      return getBridgeQuoteMessage(crossSwap, appFee, originSwapQuote);
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

      if (sponsoredGaslessRoute) {
        const outputAmount = ConvertDecimals(
          inputToken.decimals,
          outputToken.decimals
        )(exactInputAmount);
        return {
          bridgeQuote: {
            ...bridgeQuote,
            provider: name,
            outputAmount,
            minOutputAmount: outputAmount,
            estimatedFillTimeSec:
              bridgeQuote.suggestedFees.estimatedFillTimeSec,
            fees: getZeroBridgeFees(inputToken),
            suggestedFees: {
              ...bridgeQuote.suggestedFees,
              outputAmount: outputAmount.toString(),
              totalRelayFee: {
                pct: "0",
                total: "0",
              },
              relayerCapitalFee: {
                pct: "0",
                total: "0",
              },
              relayerGasFee: {
                pct: "0",
                total: "0",
              },
              lpFee: {
                pct: "0",
                total: "0",
              },
              // Explicit override
              exclusivityDeadline:
                sponsoredGaslessRoute.exclusivityDeadline ??
                bridgeQuote.suggestedFees.exclusivityDeadline,
              exclusiveRelayer: sponsoredGaslessRoute.exclusiveRelayer,
            },
          },
        };
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

      if (sponsoredGaslessRoute) {
        const inputAmount = ConvertDecimals(
          outputToken.decimals,
          inputToken.decimals
        )(minOutputAmount);
        return {
          bridgeQuote: {
            ...bridgeQuote,
            provider: name,
            inputAmount,
            minOutputAmount,
            outputAmount: minOutputAmount,
            estimatedFillTimeSec:
              bridgeQuote.suggestedFees.estimatedFillTimeSec,
            fees: getZeroBridgeFees(inputToken),
            suggestedFees: {
              ...bridgeQuote.suggestedFees,
              inputAmount: inputAmount.toString(),
              totalRelayFee: {
                pct: "0",
                total: "0",
              },
              relayerCapitalFee: {
                pct: "0",
                total: "0",
              },
              relayerGasFee: {
                pct: "0",
                total: "0",
              },
              lpFee: {
                pct: "0",
                total: "0",
              },
              // Explicit override
              exclusiveRelayer: sponsoredGaslessRoute.exclusiveRelayer,
            },
          },
        };
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

    buildGaslessTx: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string | undefined;
      permitParams: {
        type: "erc3009";
        validAfter: number;
        validBefore: number;
      };
    }) => {
      if (params.permitParams.type !== "erc3009") {
        throw new Error(
          `Can't build gasless tx for permit type '${params.permitParams.type}'`
        );
      }

      const tx = await buildErc3009Tx({
        quotes: params.quotes,
        integratorId: params.integratorId,
        validAfter: params.permitParams.validAfter,
        validBefore: params.permitParams.validBefore,
      });
      return tx;
    },

    isRouteSupported: () => {
      return true;
    },
  };
}
