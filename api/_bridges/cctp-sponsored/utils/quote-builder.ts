import { BigNumber } from "ethers";
import { createCctpSignature, SponsoredCCTPQuote } from "./signing";
import { toBytes32 } from "../../../_address";
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
  buildLighterDepositActionData,
  getLighterIntermediaryChainId,
  isToLighter,
} from "../../../_lighter";
import {
  getSponsoredCctpDstPeripheryAddress,
  CCTP_TRANSFER_MODE,
} from "./constants";
import { getSponsoredCctpFinalTokenAddress } from "./final-token";
import { getHyperEvmChainId } from "../../../_hypercore";

/**
 * Builds a complete sponsored CCTP quote with signature
 * @param params Quote building parameters
 * @returns Complete quote with signed and unsigned params, plus signature
 */
export async function buildSponsoredCCTPQuote(
  params: BuildSponsoredQuoteParams & {
    maxFee: BigNumber;
    outputAmount: BigNumber;
  }
) {
  const {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    recipient,
    depositor,
    maxBpsToSponsor,
    maxUserSlippageBps,
    maxFee,
  } = params;

  const isDestinationHyperCore = isToHyperCore(outputToken.chainId);
  const isDestinationLighter = isToLighter(outputToken.chainId);

  if (!isDestinationHyperCore && !isDestinationLighter) {
    throw new Error(
      "Can't build sponsored CCTP quote for non-HyperCore or non-Lighter destination"
    );
  }

  const intermediaryChainId = isDestinationLighter
    ? getLighterIntermediaryChainId(outputToken.chainId)
    : getHyperEvmChainId(outputToken.chainId);

  const nonce = generateQuoteNonce(depositor);

  const deadline = Math.floor(Date.now() / 1000) + DEFAULT_QUOTE_EXPIRY_SECONDS;

  const sponsoredCCTPDstPeripheryAddress =
    getSponsoredCctpDstPeripheryAddress(intermediaryChainId);
  if (!sponsoredCCTPDstPeripheryAddress) {
    throw new Error(
      `'SponsoredCCTPDstPeriphery' not found for intermediary chain ${intermediaryChainId}`
    );
  }

  const finalToken = getSponsoredCctpFinalTokenAddress(
    outputToken.symbol,
    intermediaryChainId
  );

  const actionData = isDestinationLighter
    ? await buildLighterDepositActionData({
        recipient,
        outputTokenSymbol: outputToken.symbol,
        routeType: 0,
        outputAmount,
        destinationChainId: outputToken.chainId,
        sponsoredCCTPDstPeripheryAddress,
      })
    : "0x";
  const executionMode = isDestinationLighter
    ? ExecutionMode.ArbitraryActionsToEVM
    : ExecutionMode.Default;

  const sponsoredCCTPQuote: SponsoredCCTPQuote = {
    sourceDomain: getCctpDomainId(inputToken.chainId),
    destinationDomain: getCctpDomainId(intermediaryChainId),
    destinationCaller: toBytes32(sponsoredCCTPDstPeripheryAddress),
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
    executionMode,
    actionData,
  };

  const { signature, typedDataHash } = createCctpSignature(sponsoredCCTPQuote);

  return {
    quote: sponsoredCCTPQuote,
    signature,
    hash: typedDataHash,
  };
}
