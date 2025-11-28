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
    [CHAIN_IDs.INK]: 8,
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
    [CHAIN_IDs.INK]: 30 * 60,
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
 * Get the transfer mode for a given origin chain and amount.
 * Falls back to "standard" if:
 * - The requested mode is not supported
 * - checkAllowance is true and the amount exceeds available fast burn allowance (See: https://developers.circle.com/cctp#fast-transfer)
 */
export const getTransferMode = async (
  originChainId: number,
  amount: BigNumber,
  tokenDecimals: number,
  requestedTransferMode: "standard" | "fast" = "fast",
  checkAllowance = false
): Promise<"standard" | "fast"> => {
  if (!isTransferModeSupported(originChainId, requestedTransferMode)) {
    return "standard";
  }

  // If fast mode is requested, check if the amount is within allowance
  if (requestedTransferMode === "fast" && checkAllowance) {
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
