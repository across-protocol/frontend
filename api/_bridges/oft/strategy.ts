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
import { getNativeTokenInfo } from "../../swap/_utils";
import {
  getOftMessengerForToken,
  createSendParamStruct,
  OFT_ABI,
  OFT_MESSENGERS,
  HYPEREVM_OFT_COMPOSER_ADDRESSES,
} from "./utils/constants";
import {
  getEstimatedFillTime,
  getHyperLiquidComposerMessage,
  getOftBridgeFees,
  getQuote,
  roundAmountToSharedDecimals,
} from "./utils/utils";
import { CHAIN_IDs } from "@across-protocol/constants";

const name = "oft" as const;

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
 * Builds the transaction data for an OFT bridge transfer.
 * This function takes the quotes and other parameters and constructs the transaction data for sending an OFT.
 * It also handles the special case of sending to Hyperliquid, where a custom message is composed.
 *
 * @param params The parameters for building the transaction.
 * @param params.quotes The quotes for the cross-swap, including the bridge quote.
 * @param params.integratorId The ID of the integrator.
 * @returns A promise that resolves with the transaction data.
 */
export async function buildOftTx(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
}) {
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
  // If sending to Hyperliquid, compose the special message to contact the Hyperliquid Composer
  // This includes setting the toAddress to the Composer contract address and creating the composeMsg and extraOptions
  const { toAddress, composeMsg, extraOptions } =
    destinationChainId === CHAIN_IDs.HYPERCORE
      ? getHyperLiquidComposerMessage(
          crossSwap.recipient!,
          crossSwap.outputToken.symbol
        )
      : {
          toAddress: crossSwap.recipient!,
          composeMsg: "0x",
          extraOptions: "0x",
        };

  const roundedInputAmount = roundAmountToSharedDecimals(
    bridgeQuote.inputAmount,
    bridgeQuote.inputToken.symbol,
    bridgeQuote.inputToken.decimals
  );

  // Create SendParam struct
  const sendParam = createSendParamStruct({
    destinationChainId:
      destinationChainId === CHAIN_IDs.HYPERCORE
        ? CHAIN_IDs.HYPEREVM
        : destinationChainId,
    toAddress,
    amountLD: roundedInputAmount,
    minAmountLD: roundedInputAmount,
    composeMsg,
    extraOptions,
  });

  // Get messaging fee quote
  const provider = getProvider(originChainId);
  const oftMessengerContract = new Contract(
    oftMessengerAddress,
    OFT_ABI,
    provider
  );
  const messagingFee = await oftMessengerContract.quoteSend(sendParam, false);

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
}

/**
 * Checks if a route is supported for OFT bridging.
 * A route is supported if the input and output tokens are the same, and the token is configured for OFT on both the origin and destination chains.
 * It also checks for the special case of bridging to Hyperliquid, where the output token is on the Hypercore chain.
 *
 * @param params The parameters for checking the route.
 * @param params.inputToken The input token.
 * @param params.outputToken The output token.
 * @returns True if the route is supported, false otherwise.
 */
export function isRouteSupported(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  // Both tokens must be the same
  if (
    params.inputToken.symbol !== params.outputToken.symbol &&
    params.outputToken.symbol !== `${params.inputToken.symbol}-SPOT`
  ) {
    return false;
  }

  // Token must be supported by OFT
  const oftMessengerContract = OFT_MESSENGERS[params.inputToken.symbol];

  if (oftMessengerContract[params.inputToken.chainId]) {
    if (oftMessengerContract[params.outputToken.chainId]) {
      // Both chains must have OFT contracts configured for the token
      return true;
    }
    const oftComposerContract =
      HYPEREVM_OFT_COMPOSER_ADDRESSES[params.outputToken.symbol];
    if (
      params.outputToken.chainId === CHAIN_IDs.HYPERCORE &&
      oftComposerContract
    ) {
      // The oft transfer is sending OFT directly to hyperCore via the composer contract
      return true;
    }
  }
  return false;
}

/**
 * Asserts that a route is supported for OFT bridging.
 * Throws an error if the route is not supported.
 *
 * @param params The parameters for checking the route.
 * @param params.inputToken The input token.
 * @param params.outputToken The output token.
 * @throws {InvalidParamError} If the route is not supported.
 */
function assertSupportedRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  if (!isRouteSupported(params)) {
    throw new InvalidParamError({
      message: `OFT: Route ${params.inputToken.symbol} -> ${params.outputToken.symbol} is not supported for bridging from ${params.inputToken.chainId} to ${params.outputToken.chainId}`,
    });
  }
}

/**
 * Gets a quote for an OFT bridge transfer with a specified output amount.
 * This function is used when the user wants to receive a specific amount of tokens on the destination chain.
 *
 * @param params The parameters for getting the quote.
 * @param params.inputToken The input token.
 * @param params.outputToken The output token.
 * @param params.minOutputAmount The minimum output amount.
 * @param params.recipient The recipient address.
 * @returns A promise that resolves with the quote data.
 */
async function getOftQuoteForOutput(params: GetOutputBridgeQuoteParams) {
  const { inputToken, outputToken, minOutputAmount } = params;
  assertSupportedRoute({ inputToken, outputToken });

  // Convert minOutputAmount to input token decimals
  const minOutputInInputDecimals = ConvertDecimals(
    outputToken.decimals,
    inputToken.decimals
  )(minOutputAmount);

  // Get quote from OFT contracts and estimated fill time in parallel
  const [{ inputAmount, outputAmount, nativeFee }, estimatedFillTimeSec] =
    await Promise.all([
      getQuote({
        inputToken,
        outputToken,
        inputAmount: minOutputInInputDecimals,
        recipient: params.recipient!,
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

  const nativeToken = getNativeTokenInfo(inputToken.chainId);

  return {
    bridgeQuote: {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      minOutputAmount,
      estimatedFillTimeSec,
      provider: name,
      fees: getOftBridgeFees({
        inputToken,
        nativeFee,
        nativeToken,
      }),
    },
  };
}

/**
 * Determines the cross-swap type for an OFT bridge transfer.
 * For OFT, the only supported type is `BRIDGEABLE_TO_BRIDGEABLE`, which means that the tokens are the same on both the origin and destination chains.
 *
 * @param params The parameters for determining the cross-swap type.
 * @param params.inputToken The input token.
 * @param params.outputToken The output token.
 * @param params.isInputNative A boolean indicating if the input token is native.
 * @param params.isOutputNative A boolean indicating if the output token is native.
 * @returns An array of supported cross-swap types.
 */
export function getOftCrossSwapTypes(params: {
  inputToken: Token;
  outputToken: Token;
  isInputNative: boolean;
  isOutputNative: boolean;
}) {
  return isRouteSupported({
    inputToken: params.inputToken,
    outputToken: params.outputToken,
  })
    ? [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE]
    : [];
}

/**
 * Gets a quote for an OFT bridge transfer with a specified exact input amount.
 * This function is used when the user wants to send a specific amount of tokens from the origin chain.
 *
 * @param params The parameters for getting the quote.
 * @param params.inputToken The input token.
 * @param params.outputToken The output token.
 * @param params.exactInputAmount The exact input amount.
 * @param params.recipient The recipient address.
 * @param params.message An optional message to be sent with the transfer.
 * @returns A promise that resolves with the quote data.
 */
export async function getOftQuoteForExactInput({
  inputToken,
  outputToken,
  exactInputAmount,
  recipient,
  message: _message,
}: GetExactInputBridgeQuoteParams) {
  assertSupportedRoute({ inputToken, outputToken });

  const [{ inputAmount, outputAmount, nativeFee }, estimatedFillTimeSec] =
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

  const nativeToken = getNativeTokenInfo(inputToken.chainId);

  return {
    bridgeQuote: {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount,
      minOutputAmount: outputAmount,
      estimatedFillTimeSec,
      provider: name,
      fees: getOftBridgeFees({
        inputToken,
        nativeFee,
        nativeToken,
      }),
    },
  };
}

/**
 * Gets the OFT bridge strategy.
 * This function returns the bridge strategy object for OFT, which includes all the necessary functions for quoting, building transactions, and checking for supported routes.
 *
 * @returns The OFT bridge strategy.
 */
export function getOftBridgeStrategy(): BridgeStrategy {
  return {
    name,
    capabilities,
    originTxNeedsAllowance: true,
    getCrossSwapTypes: getOftCrossSwapTypes,
    getBridgeQuoteRecipient: (crossSwap: CrossSwap) => {
      return crossSwap.recipient;
    },
    getBridgeQuoteMessage: (_crossSwap: CrossSwap, _appFee?: AppFee) => {
      return "0x";
    },
    getQuoteForExactInput: getOftQuoteForExactInput,
    getQuoteForOutput: getOftQuoteForOutput,
    buildTxForAllowanceHolder: buildOftTx,
    isRouteSupported,
  };
}
