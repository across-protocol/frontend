import { BigNumber, ethers } from "ethers";

import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes } from "../../_dexes/types";
import { AppFee, CROSS_SWAP_TYPE } from "../../_dexes/utils";
import { Token } from "../../_dexes/types";
import { InvalidParamError } from "../../_errors";
import { ConvertDecimals } from "../../_utils";
import { tagIntegratorId, tagSwapApiMarker } from "../../_integrator-id";
import {
  CCTP_SUPPORTED_CHAINS,
  CCTP_SUPPORTED_TOKENS,
  CCTP_FINALITY_THRESHOLDS,
  CCTP_FILL_TIME_ESTIMATES,
  getCctpTokenMessengerAddress,
  getCctpDomainId,
  encodeDepositForBurn,
} from "./utils/constants";
import {
  buildCctpTxHyperEvmToHyperCore,
  getAmountToHyperCore,
  isHyperEvmToHyperCoreRoute,
  isToHyperCore,
} from "./utils/hypercore";

const name = "cctp";

const capabilities: BridgeCapabilities = {
  ecosystems: ["evm", "svm"],
  supports: {
    A2A: false,
    A2B: false,
    B2A: false,
    B2B: true, // Only USDC-USDC routes are supported
    B2BI: false,
    crossChainMessage: false,
  },
};

/**
 * CCTP (Cross-Chain Transfer Protocol) bridge strategy for native USDC transfers.
 * Supports Circle's CCTP for burning USDC on source chain.
 */
export function getCctpBridgeStrategy(): BridgeStrategy {
  const getEstimatedFillTime = (originChainId: number): number => {
    // CCTP fill time is determined by the origin chain attestation process
    return CCTP_FILL_TIME_ESTIMATES[originChainId] || 19 * 60; // Default to 19 minutes
  };

  const isRouteSupported = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    // Check if input and output tokens are CCTP-supported
    const isInputTokenSupported = CCTP_SUPPORTED_TOKENS.some(
      (supportedToken) =>
        supportedToken.addresses[params.inputToken.chainId]?.toLowerCase() ===
        params.inputToken.address.toLowerCase()
    );
    const isOutputTokenSupported = CCTP_SUPPORTED_TOKENS.some(
      (supportedToken) =>
        supportedToken.addresses[params.outputToken.chainId]?.toLowerCase() ===
        params.outputToken.address.toLowerCase()
    );
    if (!isInputTokenSupported || !isOutputTokenSupported) {
      return false;
    }

    // Check if both chains are CCTP-supported
    const isOriginChainSupported = CCTP_SUPPORTED_CHAINS.includes(
      params.inputToken.chainId
    );
    const isDestinationChainSupported = CCTP_SUPPORTED_CHAINS.includes(
      params.outputToken.chainId
    );
    if (!isOriginChainSupported || !isDestinationChainSupported) {
      return false;
    }

    return true;
  };

  const assertSupportedRoute = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    if (!isRouteSupported(params)) {
      throw new InvalidParamError({
        message: `CCTP: Route ${params.inputToken.symbol} -> ${params.outputToken.symbol} is not supported`,
      });
    }
  };

  return {
    name,
    capabilities,

    originTxNeedsAllowance: true, // CCTP requires allowance for token burning

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
      assertSupportedRoute({ inputToken, outputToken });

      const outputAmount = isToHyperCore(outputToken.chainId)
        ? await getAmountToHyperCore({
            inputToken,
            outputToken,
            inputOrOutput: "input",
            amount: exactInputAmount,
            recipient,
          })
        : ConvertDecimals(
            inputToken.decimals,
            outputToken.decimals
          )(exactInputAmount);

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount: exactInputAmount,
          outputAmount,
          minOutputAmount: outputAmount,
          estimatedFillTimeSec: getEstimatedFillTime(inputToken.chainId),
          provider: name,
          fees: getCctpBridgeFees(inputToken),
        },
      };
    },

    getQuoteForOutput: async ({
      inputToken,
      outputToken,
      minOutputAmount,
      forceExactOutput: _forceExactOutput,
      recipient,
      message: _message,
    }: GetOutputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

      const inputAmount = isToHyperCore(outputToken.chainId)
        ? await getAmountToHyperCore({
            inputToken,
            outputToken,
            inputOrOutput: "output",
            amount: minOutputAmount,
            recipient,
          })
        : ConvertDecimals(
            outputToken.decimals,
            inputToken.decimals
          )(minOutputAmount);

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount,
          outputAmount: minOutputAmount,
          minOutputAmount,
          estimatedFillTimeSec: getEstimatedFillTime(inputToken.chainId),
          provider: name,
          fees: getCctpBridgeFees(inputToken),
        },
      };
    },

    buildTxForAllowanceHolder: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string;
    }) => {
      const {
        bridgeQuote,
        crossSwap,
        originSwapQuote,
        destinationSwapQuote,
        appFee,
      } = params.quotes;

      // CCTP validations
      if (appFee?.feeAmount.gt(0)) {
        throw new InvalidParamError({
          message: "CCTP: App fee handling not implemented yet",
        });
      }

      if (originSwapQuote || destinationSwapQuote) {
        throw new InvalidParamError({
          message: "CCTP: Origin/destination swaps not implemented yet",
        });
      }

      const originChainId = crossSwap.inputToken.chainId;
      const destinationChainId = crossSwap.outputToken.chainId;

      if (
        isHyperEvmToHyperCoreRoute({
          inputToken: crossSwap.inputToken,
          outputToken: crossSwap.outputToken,
        })
      ) {
        return buildCctpTxHyperEvmToHyperCore(params);
      }

      // Get CCTP contract address for origin chain
      const tokenMessengerAddress = getCctpTokenMessengerAddress(originChainId);

      // Get CCTP domain IDs
      const destinationDomain = getCctpDomainId(destinationChainId);

      // Get burn token address (USDC on origin chain)
      const burnTokenAddress = crossSwap.inputToken.address;

      // Encode the depositForBurn call
      const callData = encodeDepositForBurn({
        amount: bridgeQuote.inputAmount,
        destinationDomain,
        mintRecipient: crossSwap.recipient,
        burnToken: burnTokenAddress,
        destinationCaller: ethers.constants.AddressZero, // Anyone can finalize the message on domain when this is set to bytes32(0)
        maxFee: BigNumber.from(0), // maxFee set to 0 so this will be a "standard" speed transfer
        minFinalityThreshold: CCTP_FINALITY_THRESHOLDS.standard, // Hardcoded minFinalityThreshold value for standard transfer
      });

      // Handle integrator ID and swap API marker tagging
      const callDataWithIntegratorId = params.integratorId
        ? tagIntegratorId(params.integratorId, callData)
        : callData;
      const callDataWithMarkers = tagSwapApiMarker(callDataWithIntegratorId);

      return {
        chainId: originChainId,
        from: crossSwap.depositor,
        to: tokenMessengerAddress,
        data: callDataWithMarkers,
        value: BigNumber.from(0), // No native value for USDC burns
        ecosystem: "evm" as const,
      };
    },

    isRouteSupported,
  };
}

function getCctpBridgeFees(inputToken: Token) {
  const zeroBN = BigNumber.from(0);
  return {
    totalRelay: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    relayerCapital: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    relayerGas: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    lp: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
  };
}
