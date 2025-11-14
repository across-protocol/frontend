import { BigNumber } from "ethers";
import { createCctpSignature, SponsoredCCTPQuote } from "./signing";
import { toBytes32 } from "../../../_address";
import { CHAIN_IDs } from "../../../_constants";
import {
  generateQuoteNonce,
  ExecutionMode,
  BuildSponsoredQuoteParams,
  DEFAULT_QUOTE_EXPIRY_SECONDS,
} from "../../../_sponsorship-utils";
import {
  CCTP_FINALITY_THRESHOLDS,
  getCctpDomainId,
} from "../../cctp/utils/constants";
import { isToHyperCore } from "../../cctp/utils/hypercore";
import {
  SPONSORED_CCTP_DST_PERIPHERY_ADDRESSES,
  SPONSORED_CCTP_QUOTE_FINALIZER_ADDRESS,
  CCTP_TRANSFER_MODE,
} from "./constants";
import { getSponsoredCctpFinalTokenAddress } from "./final-token";

/**
 * Builds a complete sponsored CCTP quote with signature
 * @param params Quote building parameters
 * @returns Complete quote with signed and unsigned params, plus signature
 */
export function buildSponsoredCCTPQuote(
  params: BuildSponsoredQuoteParams & { maxFee: BigNumber }
) {
  const {
    inputToken,
    outputToken,
    inputAmount,
    recipient,
    depositor,
    maxBpsToSponsor,
    maxUserSlippageBps,
    maxFee,
  } = params;

  const isDestinationHyperCore = isToHyperCore(outputToken.chainId);

  if (!isDestinationHyperCore) {
    throw new Error(
      "Can't build sponsored CCTP quote for non-HyperCore destination"
    );
  }

  const nonce = generateQuoteNonce(depositor);

  const deadline = Math.floor(Date.now() / 1000) + DEFAULT_QUOTE_EXPIRY_SECONDS;

  const intermediaryChainId =
    outputToken.chainId === CHAIN_IDs.HYPERCORE
      ? CHAIN_IDs.HYPEREVM
      : CHAIN_IDs.HYPEREVM_TESTNET;

  const sponsoredCCTPDstPeripheryAddress =
    SPONSORED_CCTP_DST_PERIPHERY_ADDRESSES[intermediaryChainId];
  if (!sponsoredCCTPDstPeripheryAddress) {
    throw new Error(
      `'SponsoredCCTPDstPeriphery' not found for intermediary chain ${intermediaryChainId}`
    );
  }

  const finalToken = getSponsoredCctpFinalTokenAddress(
    outputToken.symbol,
    intermediaryChainId
  );

  const sponsoredCCTPQuote: SponsoredCCTPQuote = {
    sourceDomain: getCctpDomainId(inputToken.chainId),
    destinationDomain: getCctpDomainId(intermediaryChainId),
    destinationCaller: toBytes32(SPONSORED_CCTP_QUOTE_FINALIZER_ADDRESS),
    mintRecipient: toBytes32(sponsoredCCTPDstPeripheryAddress),
    amount: inputAmount,
    burnToken: toBytes32(inputToken.address),
    maxFee,
    minFinalityThreshold: CCTP_FINALITY_THRESHOLDS[CCTP_TRANSFER_MODE],
    nonce,
    deadline,
    maxBpsToSponsor,
    maxUserSlippageBps,
    finalRecipient: toBytes32(recipient),
    finalToken: toBytes32(finalToken),
    executionMode: ExecutionMode.Default, // Default HyperCore flow
    actionData: "0x", // Empty for default flow
  };

  const { signature, typedDataHash } = createCctpSignature(sponsoredCCTPQuote);

  return {
    quote: sponsoredCCTPQuote,
    signature,
    hash: typedDataHash,
  };
}
