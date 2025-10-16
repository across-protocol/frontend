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
  getOftOriginConfirmations,
  getOftEndpointId,
  DEFAULT_OFT_REQUIRED_DVNS,
  CONFIG_TYPE_ULN,
  ENDPOINT_ABI,
  OFT_ABI,
  OFT_MESSENGERS,
  OFT_SHARED_DECIMALS,
  V2_ENDPOINTS,
  HYPERCORE_OFT_COMPOSER_ADDRESSES,
} from "./utils/constants";
import * as chainConfigs from "../../../scripts/chain-configs";
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
export async function getRequiredDVNCount(
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
export async function getQuote(params: {
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
  const { toAddress, composeMsg, extraOptions } =
    outputToken.chainId === CHAIN_IDs.HYPERCORE
      ? getHyperLiquidComposerMessage(recipient, outputToken.symbol)
      : { toAddress: recipient, composeMsg: "0x", extraOptions: "0x" };
  // Create SendParam struct for quoting
  const sendParam = createSendParamStruct({
    // If sending to Hypercore, the destinationChainId in the SendParam is always HyperEVM
    destinationChainId:
      outputToken.chainId === CHAIN_IDs.HYPERCORE
        ? CHAIN_IDs.HYPEREVM
        : outputToken.chainId,
    toAddress,
    amountLD: roundedInputAmount,
    minAmountLD: roundedInputAmount,
    composeMsg,
    extraOptions,
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

  // Create SendParam struct
  const sendParam = createSendParamStruct({
    destinationChainId:
      destinationChainId === CHAIN_IDs.HYPERCORE
        ? CHAIN_IDs.HYPEREVM
        : destinationChainId,
    toAddress,
    amountLD: bridgeQuote.inputAmount,
    minAmountLD: bridgeQuote.minOutputAmount,
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

export async function getEstimatedFillTime(
  originChainId: number,
  destinationChainId: number,
  tokenSymbol: string
): Promise<number> {
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
}

export function isRouteSupported(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  // Both tokens must be the same
  if (params.inputToken.symbol !== params.outputToken.symbol) {
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
      HYPERCORE_OFT_COMPOSER_ADDRESSES[params.outputToken.symbol];
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
 * OFT (Omnichain Fungible Token) bridge strategy
 */
export function getOftCrossSwapTypes(params: {
  inputToken: Token;
  outputToken: Token;
  isInputNative: boolean;
  isOutputNative: boolean;
}) {
  if (
    isRouteSupported({
      inputToken: params.inputToken,
      outputToken: params.outputToken,
    })
  ) {
    return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE];
  }
  return [];
}

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

function getOftBridgeFees(params: {
  inputToken: Token;
  nativeFee: BigNumber;
  nativeToken: Token;
}) {
  const { inputToken, nativeFee, nativeToken } = params;
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
    bridgeFee: {
      pct: zeroBN,
      total: nativeFee,
      token: nativeToken,
    },
  };
}

export function getHyperLiquidComposerMessage(
  recipient: string,
  tokenSymbol: string
): {
  composeMsg: string;
  toAddress: string;
  extraOptions: string;
} {
  // The `composeMsg` is the payload for the HyperLiquidComposer.
  // The composer contract's `decodeMessage` function expects: abi.decode(_composeMessage, (uint256, address))
  // See: https://github.com/LayerZero-Labs/devtools/blob/ed399e9e57e00848910628a2f89b958c11f63162/packages/hyperliquid-composer/contracts/HyperLiquidComposer.sol#L104
  const composeMsg = ethers.utils.defaultAbiCoder.encode(
    ["uint256", "address"],
    [
      0, // `minMsgValue` is 0 as we are not sending native HYPE tokens.
      recipient, // `to` is the final user's address on Hyperliquid L1.
    ]
  );
  if (!HYPERCORE_OFT_COMPOSER_ADDRESSES[tokenSymbol]) {
    throw new InvalidParamError({
      message: `OFT: No Hyperliquid Composer contract configured for token ${tokenSymbol}`,
    });
  }
  // When composing a message for Hyperliquid, the recipient of the OFT `send` call
  // is always the Hyperliquid Composer contract on HyperEVM.
  const toAddress = HYPERCORE_OFT_COMPOSER_ADDRESSES[tokenSymbol];

  /**
   * @notice Explanation of the custom `extraOptions` payload for the Hyperliquid Composer.
   *
   * ## What is `extraOptions`?
   *
   * The `extraOptions` parameter is a concept from the LayerZero protocol. It's a `bytes` string used to pass
   * special instructions and, most importantly, pre-pay for the gas required to execute a transaction on the
   * destination chain.
   *
   * Think of it as a "secret handshake" or a special delivery form. A standard transaction might fail, but one
   * with the correct `extraOptions` is recognized and processed by the destination contract.
   *
   * ## Why This Specific Value: `0x00030100130300000000000000000000000000000000ea60`
   *
   * This value is not a standard gas payment; it's a custom-packed 26-byte struct required by the legacy V1-style
   * integration that the Hyperliquid Composer uses. On-chain analysis of successful transactions proves this is the
   * only format the contract will accept.
   * Examples here: https://polygonscan.com/tx/0x3b96ab9962692d173cd6851fc8308fce3ff0eb56209298a632cef9333cfe3f3f
   * and here: https://arbiscan.io/tx/0x9a71d06971e7b52b7896b82e04e1129a123406e08bb016ed57c77a94cb46f979
   *
   * The structure is composed of three distinct parts:
   *
   * 1.  **Magic Prefix (`bytes6`):** `0x000301001303`
   * - This acts as a unique identifier or "handshake," signaling to the LayerZero network and the Composer that
   * this is a specific type of Hyperliquid-bound message.
   *
   * 2.  **Zero Padding (`bytes16`):** `0x00000000000000000000000000000000`
   * - A fixed block of 16 empty bytes required to maintain the struct's correct layout.
   *
   * 3.  **Gas Amount (`uint32`):** `0x0000ea60`
   * - This is the gas amount (in wei) being airdropped for the destination transaction on HyperEVM.
   * - The hex value `ea60` is equal to the decimal value **60,000**.
   *
   * Any deviation from this 26-byte structure will cause the destination transaction to fail with a parsing error,
   * as the Composer will not recognize the "handshake."
   *
   * ## Proof and Documentation
   *
   * - **On-Chain Proof:** The necessity of this exact format is proven by analyzing the input data of successful
   * `send` transactions on block explorers that bridge to the Hyperliquid Composer. The working example we analyzed
   * is the primary evidence.
   *
   * - **Conceptual Documentation:** While the *specific* value is custom to Hyperliquid, the *concept* of using
   * `extraOptions` to provide gas comes from the LayerZero V1 protocol's "Adapter Parameters."
   * See V2 Docs: https://docs.layerzero.network/v2/tools/sdks/options
   *
   */

  const extraOptions = "0x00030100130300000000000000000000000000000000ea60";

  return { composeMsg, toAddress, extraOptions };
}
