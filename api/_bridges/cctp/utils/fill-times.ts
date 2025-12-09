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
    [CHAIN_IDs.LINEA]: 8,
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
    [CHAIN_IDs.LINEA]: 6 * 60 * 60, // 6 hours
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
 * Docs: https://developers.circle.com/cctp#fast-transfer
 *
 * Falls back to "standard" mode if:
 * - The requested mode is not supported on the origin chain
 * - For large transfers (≥ $1M): fast mode is requested but the amount exceeds Circle's available fast burn allowance
 * - For large transfers (≥ $1M): the fast burn allowance API call fails
 *
 * @param originChainId - The origin chain ID
 * @param requestedTransferMode - The desired transfer mode
 * @param amount - The transfer amount in token units
 * @param tokenDecimals - The number of decimals for the transfer token
 * @returns The transfer mode to use ("standard" or "fast")
 */
export const getTransferMode = async (
  originChainId: number,
  requestedTransferMode: "standard" | "fast",
  amount: BigNumber,
  tokenDecimals: number
): Promise<"standard" | "fast"> => {
  if (!isTransferModeSupported(originChainId, requestedTransferMode)) {
    return "standard";
  }

  // If fast mode is requested and is a large transfer (≥ $1M), check if the amount is within allowance
  const allowanceCheckMinAmount = utils.parseUnits("1000000", tokenDecimals);
  if (requestedTransferMode === "fast" && amount.gt(allowanceCheckMinAmount)) {
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
