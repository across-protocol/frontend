import {
  SignedQuoteParams,
  UnsignedQuoteParams,
  SponsoredOFTQuote,
  createOftSignature,
} from "./signing";
import { toBytes32 } from "../../../_address";
import { getOftEndpointId } from "../../oft/utils/constants";
import {
  DEFAULT_LZ_RECEIVE_GAS_LIMIT,
  DEFAULT_LZ_COMPOSE_GAS_LIMIT,
  DST_OFT_HANDLER,
} from "./constants";
import { CHAIN_IDs } from "../../../_constants";
import {
  generateQuoteNonce,
  BuildSponsoredQuoteParams,
  DEFAULT_QUOTE_EXPIRY_SECONDS,
  ExecutionMode,
} from "../../../_sponsorship-utils";

/**
 * Builds a complete sponsored OFT quote with signature
 * @param params Quote building parameters
 * @returns Complete quote with signed and unsigned params, plus signature
 */
export function buildSponsoredOFTQuote(params: BuildSponsoredQuoteParams): {
  quote: SponsoredOFTQuote;
  signature: string;
  hash: string;
} {
  const {
    inputToken,
    outputToken,
    inputAmount,
    recipient,
    depositor,
    refundRecipient,
    maxBpsToSponsor,
    maxUserSlippageBps,
  } = params;

  // Generate unique nonce
  const nonce = generateQuoteNonce(depositor);

  // Calculate deadline (current time + expiry)
  const deadline = Math.floor(Date.now() / 1000) + DEFAULT_QUOTE_EXPIRY_SECONDS;

  // Get LayerZero endpoint IDs
  // All sponsored OFT transfers route through HyperEVM as intermediary chain
  const srcEid = getOftEndpointId(inputToken.chainId);
  const intermediaryChainId = CHAIN_IDs.HYPEREVM;
  const dstEid = getOftEndpointId(intermediaryChainId);

  // Get destination handler address for intermediary chain
  const destinationHandlerAddress = DST_OFT_HANDLER[intermediaryChainId];
  if (!destinationHandlerAddress) {
    throw new Error(
      `Destination handler not found for intermediary chain ${intermediaryChainId}`
    );
  }

  // Build signed parameters
  const signedParams: SignedQuoteParams = {
    srcEid,
    dstEid,
    destinationHandler: toBytes32(destinationHandlerAddress),
    amountLD: inputAmount,
    nonce,
    deadline,
    maxBpsToSponsor,
    finalRecipient: toBytes32(recipient),
    finalToken: toBytes32(outputToken.address),
    lzReceiveGasLimit: DEFAULT_LZ_RECEIVE_GAS_LIMIT,
    lzComposeGasLimit: DEFAULT_LZ_COMPOSE_GAS_LIMIT,
    executionMode: ExecutionMode.Default, // Default HyperCore flow
    actionData: "0x", // Empty for default flow
  };

  // Build unsigned parameters
  const unsignedParams: UnsignedQuoteParams = {
    maxUserSlippageBps,
    refundRecipient,
  };

  // Create signature
  const { signature, hash } = createOftSignature(signedParams);

  const quote: SponsoredOFTQuote = {
    signedParams,
    unsignedParams,
  };

  return { quote, signature, hash };
}
