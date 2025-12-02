import { BigNumber, utils } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { CHAIN_IDs } from "../../../_constants";
import { getLogger, compactAxiosError } from "../../../_utils";

// CCTP estimated fill times in seconds for fast and standard transfer modes
// Source: https://developers.circle.com/cctp/required-block-confirmations
export const CCTP_FILL_TIME_ESTIMATES: {
  fast: Record<number, number>;
  standard: Record<number, number>;
} = {
  fast: {
    [CHAIN_IDs.MAINNET]: 20,
    [CHAIN_IDs.ARBITRUM]: 8,
    [CHAIN_IDs.BASE]: 8,
    [CHAIN_IDs.OPTIMISM]: 8,
    [CHAIN_IDs.SOLANA]: 8,
    [CHAIN_IDs.UNICHAIN]: 8,
    [CHAIN_IDs.WORLD_CHAIN]: 8,
  },
  standard: {
    [CHAIN_IDs.MAINNET]: 19 * 60,
    [CHAIN_IDs.ARBITRUM]: 19 * 60,
    [CHAIN_IDs.BASE]: 19 * 60,
    [CHAIN_IDs.HYPEREVM]: 5,
    [CHAIN_IDs.MONAD]: 5,
    [CHAIN_IDs.OPTIMISM]: 19 * 60,
    [CHAIN_IDs.POLYGON]: 8,
    [CHAIN_IDs.SOLANA]: 25,
    [CHAIN_IDs.UNICHAIN]: 19 * 60,
    [CHAIN_IDs.WORLD_CHAIN]: 19 * 60,
  },
};

export const getEstimatedFillTime = (
  originChainId: number,
  standardOrFast: "standard" | "fast" = "standard"
): number => {
  const fallback = standardOrFast === "standard" ? 19 * 60 : 8;
  // CCTP fill time is determined by the origin chain attestation process
  return CCTP_FILL_TIME_ESTIMATES[standardOrFast][originChainId] || fallback;
};

/**
 * Check if a transfer mode is supported for a given origin chain
 */
export const isTransferModeSupported = (
  chainId: number,
  transferMode: "standard" | "fast"
): boolean => {
  return CCTP_FILL_TIME_ESTIMATES[transferMode][chainId] !== undefined;
};

/**
 * Determines the appropriate CCTP transfer mode (standard or fast) for a given transfer.
 *
 * Returns "standard" mode if:
 * - The requested mode is not supported on the origin chain.
 * - Fast mode is requested with allowance checking enabled, and the transfer amount exceeds Circle's fast burn allowance.
 *    (See: https://developers.circle.com/cctp#fast-transfer)
 * - Allowance checking is enabled and the fast burn allowance API call fails.
 *
 * @param originChainId - The origin chain ID
 * @param requestedTransferMode - The desired transfer mode.
 * @param checkAllowance - Whether to check fast burn allowance limit. Defaults to false since allowance is rarely exceeded.
 * @param amount - The transfer amount in token units. Required when checkAllowance is true.
 * @param tokenDecimals - The number of decimals for the amount token. Required when checkAllowance is true.
 * @returns The transfer mode to use.
 *
 */
export const getTransferMode = async (
  originChainId: number,
  requestedTransferMode: "standard" | "fast",
  checkAllowance = false,
  amount?: BigNumber,
  tokenDecimals?: number
): Promise<"standard" | "fast"> => {
  if (!isTransferModeSupported(originChainId, requestedTransferMode)) {
    return "standard";
  }

  // If fast mode is requested, check if the amount is within allowance
  if (requestedTransferMode === "fast" && checkAllowance) {
    if (!amount || tokenDecimals === undefined) {
      throw new Error(
        "amount and tokenDecimals are required when checkAllowance is true"
      );
    }

    try {
      const isMainnet = sdk.utils.chainIsProd(originChainId);
      const fastAllowance = await sdk.utils.getV2FastBurnAllowance(isMainnet);

      const fastAllowanceInTokenUnits = utils.parseUnits(
        fastAllowance.toString(),
        tokenDecimals
      );

      if (amount.gt(fastAllowanceInTokenUnits)) {
        return "standard";
      }
    } catch (error) {
      // If we can't fetch allowance, fall back to standard mode
      getLogger().warn({
        at: "getTransferMode",
        message: "Failed to fetch fast burn allowance",
        error: compactAxiosError(error as Error),
      });
      return "standard";
    }
  }

  return requestedTransferMode;
};
