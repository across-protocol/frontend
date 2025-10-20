import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { CrossSwapQuotes } from "../../../_dexes/types";
import { tagIntegratorId, tagSwapApiMarker } from "../../../_integrator-id";
import { InvalidParamError } from "../../../_errors";
import { CHAIN_IDs } from "../../../_constants";
import { Token } from "../../../_dexes/types";
import { ConvertDecimals } from "../../../_utils";
import { accountExistsOnHyperCore } from "../../../_hypercore";
import { getCctpDomainId } from "./constants";

const HYPERCORE_ACCOUNT_CREATION_FEE_USDC = 1;

const CORE_WALLET_ADDRESSES = {
  // Currently deployed only on HyperEVM Testnet
  [CHAIN_IDs.HYPEREVM_TESTNET]: "0x0B80659a4076E9E93C7DbE0f10675A16a3e5C206",
};

// Entrypoint contract on HyperEVM for depositing USDC to Hypercore via CCTP.
const CORE_DEPOSIT_WALLET_ABI = [
  "function depositWithAuth(uint256 amount, uint256 authValidAfter, uint256 authValidBefore, bytes32 authNonce, uint8 v, bytes32 r, bytes32 s)",
  "function depositFor(address recipient, uint256 amount)",
  "function deposit(uint256 amount)",
];

export function isToHyperCore(destinationChainId: number) {
  return [CHAIN_IDs.HYPERCORE, CHAIN_IDs.HYPERCORE_TESTNET].includes(
    destinationChainId
  );
}

/**
 * Encodes forward hook data for CCTP -> HyperCore routing.
 * Works for both EVM and Solana ecosystems.
 *
 * Hook data structure (52 bytes):
 * - Bytes 0-23: "cctp-forward" magic string padded to 24 bytes
 * - Bytes 24-27: Version (0x00000000)
 * - Bytes 28-31: Data length (0x00000014 = 20 bytes in big-endian)
 * - Bytes 32-51: 20-byte HyperCore recipient address
 *
 * @param hypercoreMintRecipient address of the recipient on HyperCore (with or without 0x prefix)
 * @returns Hex string (0x-prefixed) containing the 52-byte encoded hook data
 */
export function encodeForwardHookData(hypercoreMintRecipient: string): string {
  const hookDataBuffer = Buffer.alloc(52);

  // Base hook data: "cctp-forward" (24 bytes) + version (4 bytes) + length (4 bytes)
  const baseHookData =
    "636374702d666f72776172640000000000000000000000000000000000000014";
  hookDataBuffer.write(baseHookData, 0, "hex");

  // Extract recipient address without 0x prefix
  const recipientWithoutPrefix = hypercoreMintRecipient.startsWith("0x")
    ? hypercoreMintRecipient.slice(2)
    : hypercoreMintRecipient;

  // Validate recipient address is exactly 20 bytes (40 hex characters)
  if (recipientWithoutPrefix.length !== 40) {
    throw new InvalidParamError({
      message: `Invalid HyperCore recipient address: expected 40 hex chars, got ${recipientWithoutPrefix.length}`,
      param: "hypercoreMintRecipient",
    });
  }

  // Write the 20-byte recipient address at byte offset 32
  hookDataBuffer.write(recipientWithoutPrefix, 32, "hex");

  return "0x" + hookDataBuffer.toString("hex");
}

/**
 * CCTP fee configuration type from Circle API
 */
type CctpFeeConfig = {
  finalityThreshold: number;
  minimumFee: number; // in bps
  forwardFee: {
    low: number; // in token units
    med: number;
    high: number;
  };
};

/**
 * Queries Circle API to fetch CCTP fees for the specified finality threshold.
 *
 * Transfer fee: Variable fee in basis points of the transfer amount, collected at minting time.
 * - 0 bps for standard transfers (finality threshold > 1000)
 * - Varies by origin chain for fast transfers (finality threshold ≤ 1000)
 * - See: https://developers.circle.com/cctp/technical-guide#cctp-v2-fees
 *
 * Forward fee: Fixed fee in token units charged when routing through CCTP forwarder (e.g., to HyperCore).
 * - Applies only to forwarded transfers via depositForBurnWithHook
 * - Returned in token decimals (e.g., 6 decimals for USDC)
 *
 * @param inputToken - Input token with chainId
 * @param outputToken - Output token with chainId
 * @param minFinalityThreshold - Finality threshold: 1000 for fast, 2000 for standard
 * @returns transferFeeBps (basis points) and forwardFee (in token units)
 */
export async function getCctpFees(params: {
  inputToken: Token;
  outputToken: Token;
  minFinalityThreshold: number;
}): Promise<{
  transferFeeBps: number;
  forwardFee: BigNumber;
}> {
  const { inputToken, outputToken, minFinalityThreshold } = params;

  // Check if destination is HyperCore (requires forward fee)
  const isDestinationHyperCore = isToHyperCore(outputToken.chainId);
  const useSandbox = outputToken.chainId === CHAIN_IDs.HYPERCORE_TESTNET;

  // Determine the CCTP destination domain (use HyperEVM domain for HyperCore)
  const destinationChainIdForCctp = isDestinationHyperCore
    ? CHAIN_IDs.HYPEREVM
    : outputToken.chainId;

  // Get CCTP domain IDs
  const sourceDomainId = getCctpDomainId(inputToken.chainId);
  const destDomainId = getCctpDomainId(destinationChainIdForCctp);

  const endpoint = useSandbox ? "iris-api-sandbox" : "iris-api";
  const url = `https://${endpoint}.circle.com/v2/burn/USDC/fees/${sourceDomainId}/${destDomainId}`;

  const response = await axios.get<CctpFeeConfig[]>(url, {
    params: isDestinationHyperCore ? { forward: true } : undefined,
  });

  // Find config matching the requested finality threshold
  const transferConfig = response.data.find(
    (config) => config.finalityThreshold === minFinalityThreshold
  );

  if (!transferConfig) {
    throw new Error(
      `Fee configuration not found for finality threshold ${minFinalityThreshold} in CCTP fee response`
    );
  }

  // Use medium forward fee for HyperCore destinations, 0 otherwise
  // Forward fee is a fixed fee charged by CCTP when going to HyperCore
  const forwardFee = isDestinationHyperCore ? transferConfig.forwardFee.med : 0;

  return {
    transferFeeBps: transferConfig.minimumFee,
    forwardFee: BigNumber.from(forwardFee),
  };
}

export async function getAmountToHyperCore(params: {
  inputToken: Token;
  outputToken: Token;
  inputOrOutput: "input" | "output";
  amount: BigNumber;
  recipient?: string;
}) {
  const { inputToken, outputToken, inputOrOutput, amount, recipient } = params;

  if (!recipient) {
    throw new InvalidParamError({
      message: "CCTP: Recipient is not provided",
      param: "recipient",
    });
  }

  const recipientExists = await accountExistsOnHyperCore({
    account: recipient,
  });

  if (recipientExists) {
    return inputOrOutput === "input"
      ? ConvertDecimals(inputToken.decimals, outputToken.decimals)(amount) // return output amount
      : ConvertDecimals(outputToken.decimals, inputToken.decimals)(amount); // return input amount
  }

  // If recipient does not exist on HyperCore, consider 1 USDC account creation fee
  const accountCreationFee = ethers.utils.parseUnits(
    HYPERCORE_ACCOUNT_CREATION_FEE_USDC.toString(),
    inputOrOutput === "input" ? inputToken.decimals : outputToken.decimals
  );

  // If provided amount is `inputAmount`, subtract account creation fee and return required output amount
  if (inputOrOutput === "input") {
    const outputAmount = amount.sub(accountCreationFee);
    if (outputAmount.lte(0)) {
      throw new InvalidParamError({
        message: "CCTP: Amount must exceed account creation fee",
        param: "amount",
      });
    }
    return ConvertDecimals(
      inputToken.decimals,
      outputToken.decimals
    )(outputAmount);
  }

  // If provided amount is `outputAmount`, add account creation fee and return required input amount
  return ConvertDecimals(
    outputToken.decimals,
    inputToken.decimals
  )(amount.add(accountCreationFee));
}

export function isHyperEvmToHyperCoreRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  // Mainnet or testnet route
  return (
    (params.inputToken.chainId === CHAIN_IDs.HYPEREVM &&
      params.outputToken.chainId === CHAIN_IDs.HYPERCORE) ||
    (params.inputToken.chainId === CHAIN_IDs.HYPEREVM_TESTNET &&
      params.outputToken.chainId === CHAIN_IDs.HYPERCORE_TESTNET)
  );
}

export function buildCctpTxHyperEvmToHyperCore(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
}) {
  const { bridgeQuote, crossSwap } = params.quotes;

  if (
    !isHyperEvmToHyperCoreRoute({
      inputToken: crossSwap.inputToken,
      outputToken: crossSwap.outputToken,
    })
  ) {
    throw new InvalidParamError({
      message: "Invalid route specified for HyperEVM -> HyperCore via CCTP",
      param: "inputToken, outputToken",
    });
  }

  const coreWalletAddress = CORE_WALLET_ADDRESSES[crossSwap.inputToken.chainId];

  if (!coreWalletAddress) {
    throw new InvalidParamError({
      message: `CoreWallet address not found for chain ${crossSwap.inputToken.chainId}`,
      param: "inputToken.chainId",
    });
  }

  const iface = new ethers.utils.Interface(CORE_DEPOSIT_WALLET_ABI);

  const callData = iface.encodeFunctionData("depositFor", [
    crossSwap.recipient,
    bridgeQuote.inputAmount,
  ]);

  const callDataWithIntegratorId = params.integratorId
    ? tagIntegratorId(params.integratorId, callData)
    : callData;
  const callDataWithSwapApiMarker = tagSwapApiMarker(callDataWithIntegratorId);

  return {
    chainId: crossSwap.inputToken.chainId,
    from: crossSwap.depositor,
    to: coreWalletAddress,
    data: callDataWithSwapApiMarker,
    value: BigNumber.from(0),
    ecosystem: "evm" as const,
  };
}

/**
 * Check if this is an EVM (non-HyperEVM, non-Solana) → HyperCore route
 * These routes use depositForBurnWithHook with CCTP Forwarder
 */
export function isEvmToHyperCoreRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  // Check if destination is HyperCore (mainnet or testnet)
  const isDestinationHyperCore = isToHyperCore(params.outputToken.chainId);

  // Exclude HyperEVM → HyperCore (has special CoreWallet flow)
  if (isHyperEvmToHyperCoreRoute(params)) {
    return false;
  }

  // Check if source is EVM (not Solana or other non-EVM chains)
  const isSourceEvm = ![
    CHAIN_IDs.SOLANA,
    CHAIN_IDs.SOLANA_DEVNET,
    CHAIN_IDs.HYPERCORE,
    CHAIN_IDs.HYPERCORE_TESTNET,
  ].includes(params.inputToken.chainId);

  return isDestinationHyperCore && isSourceEvm;
}
