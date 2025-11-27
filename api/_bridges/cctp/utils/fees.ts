import { BigNumber } from "ethers";
import axios from "axios";

import { CCTP_FINALITY_THRESHOLDS, getCctpDomainId } from "./constants";
import { Token } from "../../../_dexes/types";

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
 * - See: https://developers.circle.com/cctp/technical-guide#fees
 *
 * Forward fee: Fixed fee in token units charged when routing through CCTP forwarder (e.g., to HyperCore).
 * - Applies only to forwarded transfers via depositForBurnWithHook
 * - Returned in token decimals (e.g., 6 decimals for USDC)
 *
 * @param params.inputToken - Input token with chainId
 * @param params.outputToken - Output token with chainId
 * @param params.transferMode - Transfer mode: "standard" or "fast"
 * @param params.useSandbox - Whether to use the sandbox environment
 * @param params.useForwardFee - Whether to use the forward fee
 * @returns transferFeeBps (basis points) and forwardFee (in token units)
 */
export async function getCctpFees(params: {
  inputToken: Token;
  outputToken: Token;
  transferMode: "standard" | "fast";
  useSandbox?: boolean;
  useForwardFee?: boolean;
}): Promise<{
  transferFeeBps: number;
  forwardFee: BigNumber;
}> {
  const { inputToken, outputToken, transferMode, useSandbox, useForwardFee } =
    params;

  // Get CCTP domain IDs
  const sourceDomainId = getCctpDomainId(inputToken.chainId);
  const destDomainId = getCctpDomainId(outputToken.chainId);

  const endpoint = useSandbox ? "iris-api-sandbox" : "iris-api";
  const url = `https://${endpoint}.circle.com/v2/burn/USDC/fees/${sourceDomainId}/${destDomainId}`;
  const response = await axios.get<CctpFeeConfig[]>(url, {
    params: useForwardFee ? { forward: true } : undefined,
  });

  const finalityThreshold = CCTP_FINALITY_THRESHOLDS[transferMode];

  // Find config matching the requested finality threshold
  const transferConfig = response.data.find(
    (config) => config.finalityThreshold === finalityThreshold
  );

  if (!transferConfig) {
    throw new Error(
      `Fee configuration not found for finality threshold ${finalityThreshold} in CCTP fee response`
    );
  }

  const forwardFee = useForwardFee ? transferConfig.forwardFee.med : 0;

  return {
    transferFeeBps: transferConfig.minimumFee,
    forwardFee: BigNumber.from(forwardFee),
  };
}
