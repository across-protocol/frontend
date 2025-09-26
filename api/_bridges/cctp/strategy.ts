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
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP, CHAINS } from "../../_constants";
import { ConvertDecimals } from "../../_utils";
import { tagIntegratorId, tagSwapApiMarker } from "../../_integrator-id";
import { toBytes32 } from "../../_address";

const name = "cctp";

const CCTP_SUPPORTED_CHAINS = [
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.BASE,
  CHAIN_IDs.HYPEREVM,
  CHAIN_IDs.INK,
  CHAIN_IDs.OPTIMISM,
  CHAIN_IDs.POLYGON,
  CHAIN_IDs.SOLANA,
  CHAIN_IDs.UNICHAIN,
  CHAIN_IDs.WORLD_CHAIN,
];

const CCTP_SUPPORTED_TOKENS = [TOKEN_SYMBOLS_MAP.USDC];

const CCTP_FINALITY_THRESHOLDS = {
  fast: 1000,
  standard: 2000,
};

// CCTP TokenMessenger contract addresses
const DEFAULT_CCTP_TOKEN_MESSENGER_ADDRESS =
  "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d";

const CCTP_TOKEN_MESSENGER_ADDRESS_OVERRIDES: Record<number, string> = {
  [CHAIN_IDs.SOLANA]: "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe",
};

const getCctpTokenMessengerAddress = (chainId: number): string => {
  return (
    CCTP_TOKEN_MESSENGER_ADDRESS_OVERRIDES[chainId] ||
    DEFAULT_CCTP_TOKEN_MESSENGER_ADDRESS
  );
};

const getCctpDomainId = (chainId: number): number => {
  const chainInfo = CHAINS[chainId];
  if (!chainInfo || typeof chainInfo.cctpDomain !== "number") {
    throw new InvalidParamError({
      message: `CCTP domain not found for chain ID ${chainId}`,
    });
  }
  return chainInfo.cctpDomain;
};

// CCTP TokenMessenger depositForBurn ABI
const CCTP_DEPOSIT_FOR_BURN_ABI = {
  inputs: [
    {
      internalType: "uint256",
      name: "amount",
      type: "uint256",
    },
    {
      internalType: "uint32",
      name: "destinationDomain",
      type: "uint32",
    },
    {
      internalType: "bytes32",
      name: "mintRecipient",
      type: "bytes32",
    },
    {
      internalType: "address",
      name: "burnToken",
      type: "address",
    },
    {
      internalType: "bytes32",
      name: "destinationCaller",
      type: "bytes32",
    },
    {
      internalType: "uint256",
      name: "maxFee",
      type: "uint256",
    },
    {
      internalType: "uint32",
      name: "minFinalityThreshold",
      type: "uint32",
    },
  ],
  name: "depositForBurn",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
};

const encodeDepositForBurn = (params: {
  amount: BigNumber;
  destinationDomain: number;
  mintRecipient: string;
  burnToken: string;
  destinationCaller: string;
  maxFee: BigNumber; // Required, use BigNumber.from(0) for standard transfer
  minFinalityThreshold: number; // use 2000 for standard transfer
}): string => {
  const iface = new ethers.utils.Interface([CCTP_DEPOSIT_FOR_BURN_ABI]);

  return iface.encodeFunctionData("depositForBurn", [
    params.amount,
    params.destinationDomain,
    toBytes32(params.mintRecipient),
    params.burnToken,
    toBytes32(params.destinationCaller),
    params.maxFee,
    params.minFinalityThreshold,
  ]);
};

// CCTP estimated fill times in seconds
// Soruce: https://developers.circle.com/cctp/required-block-confirmations
const CCTP_FILL_TIME_ESTIMATES: Record<number, number> = {
  [CHAIN_IDs.MAINNET]: 19 * 60,
  [CHAIN_IDs.ARBITRUM]: 19 * 60,
  [CHAIN_IDs.BASE]: 19 * 60,
  [CHAIN_IDs.HYPEREVM]: 5,
  [CHAIN_IDs.INK]: 30 * 60,
  [CHAIN_IDs.OPTIMISM]: 19 * 60,
  [CHAIN_IDs.POLYGON]: 8,
  [CHAIN_IDs.SOLANA]: 25,
  [CHAIN_IDs.UNICHAIN]: 19 * 60,
  [CHAIN_IDs.WORLD_CHAIN]: 19 * 60,
};

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
 * Supports Circle's CCTP for burning USDC on source chain and minting on destination chain.
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
      recipient: _recipient,
      message: _message,
    }: GetExactInputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

      const outputAmount = ConvertDecimals(
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
      recipient: _recipient,
      message: _message,
    }: GetOutputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

      const inputAmount = ConvertDecimals(
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
