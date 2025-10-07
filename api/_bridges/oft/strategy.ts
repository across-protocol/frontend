import { BigNumber, Contract, ethers } from "ethers";

import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes, Token } from "../../_dexes/types";
import {
  AppFee,
  assertMinOutputAmount,
  CROSS_SWAP_TYPE,
} from "../../_dexes/utils";
import { InvalidParamError } from "../../_errors";
import { ConvertDecimals, getProvider } from "../../_utils";
import { tagIntegratorId, tagSwapApiMarker } from "../../_integrator-id";
import {
  getOftMessengerForToken,
  createSendParamStruct,
  getOftOriginConfirmations,
  getOftEndpointId,
  DEFAULT_OFT_REQUIRED_DVNS,
  CONFIG_TYPE_ULN,
  ENDPOINT_ABI,
  OFT_ABI,
  OFT_MESSENGERS,
  OFT_SHARED_DECIMALS,
  V2_ENDPOINTS,
} from "./utils/constants";
import * as chainConfigs from "../../../scripts/chain-configs";

const name = "oft";

const capabilities: BridgeCapabilities = {
  ecosystems: ["evm"],
  supports: {
    A2A: false,
    A2B: false,
    B2A: false,
    B2B: true, // Only same asset bridges are supported
    B2BI: false,
    crossChainMessage: false,
  },
};

/**
 * Rounds the token amount down to the correct precision for OFT transfer.
 * The last (tokenDecimals - sharedDecimals) digits must be zero to prevent contract-side rounding.
 * Shared decimals is OFT's precision model where tokens use a common decimal precision across all chains.
 * Docs: https://docs.layerzero.network/v2/concepts/technical-reference/oft-reference?utm_source=chatgpt.com#1-transferring-value-across-different-vms
 * @param amount amount to round
 * @param tokenSymbol symbol of the token we need to round decimals for
 * @param tokenDecimals decimals of the token
 * @returns The amount rounded down to the correct precision
 */
function roundAmountToSharedDecimals(
  amount: BigNumber,
  tokenSymbol: string,
  tokenDecimals: number
): BigNumber {
  const sharedDecimals = OFT_SHARED_DECIMALS[tokenSymbol];
  if (sharedDecimals === undefined) {
    throw new InvalidParamError({
      message: `Shared decimals not found for token ${tokenSymbol}`,
    });
  }

  const decimalDifference = tokenDecimals - sharedDecimals;
  if (decimalDifference > 0) {
    const divisor = BigNumber.from(10).pow(decimalDifference);
    const remainder = amount.mod(divisor);
    return amount.sub(remainder);
  }
  return amount;
}

/**
 * Fetches the number of required DVN signatures for a specific OFT route
 * @param originChainId source chain ID
 * @param destinationChainId destination chain ID
 * @param tokenSymbol token being bridged
 * @returns total number of required DVN signatures (requiredDVNs + optionalThreshold)
 */
async function getRequiredDVNCount(
  originChainId: number,
  destinationChainId: number,
  tokenSymbol: string
): Promise<number> {
  try {
    const endpointAddress = V2_ENDPOINTS[originChainId];
    if (!endpointAddress) {
      return DEFAULT_OFT_REQUIRED_DVNS;
    }

    const oappAddress = getOftMessengerForToken(tokenSymbol, originChainId);
    const dstEid = getOftEndpointId(destinationChainId);
    const provider = getProvider(originChainId);

    const endpoint = new Contract(endpointAddress, ENDPOINT_ABI, provider);

    // Step 1: Find the send library used for this route
    const libAddress = await endpoint.getSendLibrary(oappAddress, dstEid);

    // Step 2: Get DVN config for this route
    const ulnConfigBytes = await endpoint.getConfig(
      oappAddress,
      libAddress,
      dstEid,
      CONFIG_TYPE_ULN
    );

    // Step 3: Decode the UlnConfig struct directly
    const ulnConfigStructType = [
      "tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs)",
    ];
    const decoded = ethers.utils.defaultAbiCoder.decode(
      ulnConfigStructType,
      ulnConfigBytes
    )[0];

    const requiredDVNs = decoded.requiredDVNs.length;
    const optionalThreshold = decoded.optionalDVNThreshold;

    return requiredDVNs + optionalThreshold;
  } catch (error) {
    console.error("Error fetching required DVN count", error);
    // Fall back to default if fetching fails
    return DEFAULT_OFT_REQUIRED_DVNS;
  }
}

/**
 * Internal helper to get OFT quote from contracts
 * @note This function is designed for input-based quotes (specify input amount, get output amount).
 * Currently works for both input-based and output-based flows because supported tokens (USDT, WBTC) have 0 OFT fees.
 * If we ever add tokens with non-zero OFT fees, we need to refactor this function to handle output-based quotes.
 *
 * @param inputToken source token
 * @param outputToken destination token
 * @param inputAmount amount to send
 * @param recipient recipient address
 * @returns quote data including output amount and fees
 */
async function getQuote(params: {
  inputToken: Token;
  outputToken: Token;
  inputAmount: BigNumber;
  recipient: string;
}) {
  const { inputToken, outputToken, inputAmount, recipient } = params;

  // Get OFT messenger contract
  const oftMessengerAddress = getOftMessengerForToken(
    inputToken.symbol,
    inputToken.chainId
  );
  const provider = getProvider(inputToken.chainId);
  const oftMessengerContract = new Contract(
    oftMessengerAddress,
    OFT_ABI,
    provider
  );

  // Round input amount to correct precision for OFT transfer
  // Required to prevent contract-side rounding
  const roundedInputAmount = roundAmountToSharedDecimals(
    inputAmount,
    inputToken.symbol,
    inputToken.decimals
  );

  // Create SendParam struct for quoting
  const sendParam = createSendParamStruct({
    destinationChainId: outputToken.chainId,
    toAddress: recipient,
    amountLD: roundedInputAmount,
    minAmountLD: roundedInputAmount,
  });

  // Get quote from OFT contract
  const [messagingFee, oftQuoteResult] = await Promise.all([
    oftMessengerContract.quoteSend(sendParam, false), // false = pay in native token
    oftMessengerContract.quoteOFT(sendParam),
  ]);

  const [, , oftReceipt] = oftQuoteResult;
  const nativeFee = BigNumber.from(messagingFee.nativeFee);

  // LD = Local Decimals - amounts in the input token's decimal precision
  const amountReceivedLD = BigNumber.from(oftReceipt.amountReceivedLD);
  // Convert amountReceivedLD to output token decimals
  const outputAmount = ConvertDecimals(
    inputToken.decimals,
    outputToken.decimals
  )(amountReceivedLD);

  // Calculate OFT fees (difference between sent and received in input token decimals)
  const amountSentLD = BigNumber.from(oftReceipt.amountSentLD);
  const oftFeeAmount = amountSentLD.sub(amountReceivedLD);

  return {
    inputAmount: roundedInputAmount,
    outputAmount,
    nativeFee,
    oftFeeAmount,
  };
}

/**
 * OFT (Omnichain Fungible Token) bridge strategy
 */
export function getOftBridgeStrategy(): BridgeStrategy {
  const getEstimatedFillTime = async (
    originChainId: number,
    destinationChainId: number,
    tokenSymbol: string
  ): Promise<number> => {
    const DEFAULT_BLOCK_TIME_SECONDS = 5;

    // Get source chain required confirmations
    const originConfirmations = getOftOriginConfirmations(originChainId);

    // Get dynamic DVN count for this specific route
    const requiredDVNs = await getRequiredDVNCount(
      originChainId,
      destinationChainId,
      tokenSymbol
    );

    // Get origin and destination block times from chain configs
    const originChainConfig = Object.values(chainConfigs).find(
      (config) => config.chainId === originChainId
    );
    const destinationChainConfig = Object.values(chainConfigs).find(
      (config) => config.chainId === destinationChainId
    );
    const originBlockTime =
      originChainConfig?.blockTimeSeconds ?? DEFAULT_BLOCK_TIME_SECONDS;
    const destinationBlockTime =
      destinationChainConfig?.blockTimeSeconds ?? DEFAULT_BLOCK_TIME_SECONDS;

    // Total time ≈ (originBlockTime × originConfirmations) + (destinationBlockTime × (2 + numberOfDVNs))
    // Source: https://docs.layerzero.network/v2/faq#what-is-the-estimated-delivery-time-for-a-layerzero-message
    const originTime = originBlockTime * originConfirmations;
    const destinationTime = destinationBlockTime * (2 + requiredDVNs);
    const totalTime = originTime + destinationTime;

    return totalTime;
  };

  const isRouteSupported = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    // Both tokens must be the same
    if (params.inputToken.symbol !== params.outputToken.symbol) {
      return false;
    }

    // Token must be supported by OFT
    const oftMessengerContract = OFT_MESSENGERS[params.inputToken.symbol];
    if (!oftMessengerContract) {
      return false;
    }

    // Both chains must have OFT contracts configured for the token
    return Boolean(
      oftMessengerContract[params.inputToken.chainId] &&
        oftMessengerContract[params.outputToken.chainId]
    );
  };

  const assertSupportedRoute = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    if (!isRouteSupported(params)) {
      throw new InvalidParamError({
        message: `OFT: Route ${params.inputToken.symbol} -> ${params.outputToken.symbol} is not supported`,
      });
    }
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

      const [{ inputAmount, outputAmount }, estimatedFillTimeSec] =
        await Promise.all([
          getQuote({
            inputToken,
            outputToken,
            inputAmount: exactInputAmount,
            recipient: recipient!,
          }),
          getEstimatedFillTime(
            inputToken.chainId,
            outputToken.chainId,
            inputToken.symbol
          ),
        ]);

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount,
          outputAmount,
          minOutputAmount: outputAmount,
          estimatedFillTimeSec,
          provider: name,
          fees: getOftBridgeFees(inputToken),
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

      // Convert minOutputAmount to input token decimals
      const minOutputInInputDecimals = ConvertDecimals(
        outputToken.decimals,
        inputToken.decimals
      )(minOutputAmount);

      // Get quote from OFT contracts and estimated fill time in parallel
      const [{ inputAmount, outputAmount }, estimatedFillTimeSec] =
        await Promise.all([
          getQuote({
            inputToken,
            outputToken,
            inputAmount: minOutputInInputDecimals,
            recipient: recipient!,
          }),
          getEstimatedFillTime(
            inputToken.chainId,
            outputToken.chainId,
            inputToken.symbol
          ),
        ]);

      // OFT precision limitations may prevent delivering the exact minimum amount
      // We validate against the rounded amount (maximum possible given shared decimals)
      const roundedMinOutputAmount = roundAmountToSharedDecimals(
        minOutputAmount,
        inputToken.symbol,
        inputToken.decimals
      );
      assertMinOutputAmount(outputAmount, roundedMinOutputAmount);

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount,
          outputAmount,
          minOutputAmount,
          estimatedFillTimeSec,
          provider: name,
          fees: getOftBridgeFees(inputToken),
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

      // OFT validations
      if (appFee?.feeAmount.gt(0)) {
        throw new InvalidParamError({
          message: "App fee is not supported for OFT bridge transfers",
        });
      }

      if (originSwapQuote || destinationSwapQuote) {
        throw new InvalidParamError({
          message:
            "Origin/destination swaps are not supported for OFT bridge transfers",
        });
      }

      const originChainId = crossSwap.inputToken.chainId;
      const destinationChainId = crossSwap.outputToken.chainId;

      // Get OFT contract address for origin chain
      const oftMessengerAddress = getOftMessengerForToken(
        crossSwap.inputToken.symbol,
        originChainId
      );

      // Get recipient address
      const recipient = crossSwap.recipient;

      // Create SendParam struct
      const sendParam = createSendParamStruct({
        destinationChainId,
        toAddress: recipient,
        amountLD: bridgeQuote.inputAmount,
        minAmountLD: bridgeQuote.minOutputAmount,
      });

      // Get messaging fee quote
      const provider = getProvider(originChainId);
      const oftMessengerContract = new Contract(
        oftMessengerAddress,
        OFT_ABI,
        provider
      );
      const messagingFee = await oftMessengerContract.quoteSend(
        sendParam,
        false
      );

      // Encode the send call
      const iface = new ethers.utils.Interface(OFT_ABI);
      const callData = iface.encodeFunctionData("send", [
        sendParam,
        messagingFee, // MessagingFee struct
        crossSwap.refundAddress ?? crossSwap.depositor, // refundAddress
      ]);

      // Handle integrator ID and swap API marker tagging
      const callDataWithIntegratorId = params.integratorId
        ? tagIntegratorId(params.integratorId, callData)
        : callData;
      const callDataWithMarkers = tagSwapApiMarker(callDataWithIntegratorId);

      return {
        chainId: originChainId,
        from: crossSwap.depositor,
        to: oftMessengerAddress,
        data: callDataWithMarkers,
        value: BigNumber.from(messagingFee.nativeFee), // Must include native fee as value
        ecosystem: "evm" as const,
      };
    },
  };
}

// TODO: Include messageFee and oftFee in the fees structure
// https://linear.app/uma/issue/ACX-4499/add-oft-fees-to-swap-api-response
function getOftBridgeFees(inputToken: Token) {
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
