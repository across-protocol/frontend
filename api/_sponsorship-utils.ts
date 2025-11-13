import { BigNumber, utils } from "ethers";

import { Token } from "./_dexes/types";
import { toBytes32 } from "./_address";

/**
 * Parameters for building a sponsored quote
 */
export type BuildSponsoredQuoteParams = {
  inputToken: Token;
  outputToken: Token;
  inputAmount: BigNumber;
  recipient: string;
  depositor: string;
  refundRecipient: string;
  maxBpsToSponsor: BigNumber;
  maxUserSlippageBps: number;
};

export type SponsorshipEligibilityParams = {
  inputToken: Token;
  outputToken: Token;
  amount: BigNumber;
  amountType: "exactInput" | "exactOutput" | "minOutput";
  recipient?: string;
  depositor: string;
};

export type SponsorshipEligibilityData = {
  isWithinGlobalDailyLimit: boolean;
  isWithinUserDailyLimit: boolean;
  hasVaultBalance: boolean;
  isSlippageAcceptable: boolean;
  isAccountCreationValid: boolean;
};

/**
 * Execution modes for destination handler
 * Must match the ExecutionMode enum in the destination contract
 */
export enum ExecutionMode {
  Default = 0, // Default HyperCore flow
  ArbitraryActionsToCore = 1, // Execute arbitrary actions then transfer to HyperCore
  ArbitraryActionsToEVM = 2, // Execute arbitrary actions then stay on EVM
}

/**
 * Default quote expiry time (15 minutes)
 */
export const DEFAULT_QUOTE_EXPIRY_SECONDS = 15 * 60;

/**
 * Checks if a bridge transaction is eligible for sponsorship.
 *
 * Validates:
 * - Global daily limit
 * - Per-user daily limit
 * - Vault balance
 * - Swap slippage for destination swaps
 * - Account creation status
 *
 * @param params - Parameters for eligibility check
 * @returns Eligibility data or undefined if check fails
 */
export async function getSponsorshipEligibilityData(
  params: SponsorshipEligibilityParams
): Promise<SponsorshipEligibilityData | undefined> {
  // TODO: Implement actual checks
  return undefined;
}

/**
 * Generates a unique nonce for a quote
 * Uses keccak256 hash of timestamp in milliseconds + depositor address
 */
export function generateQuoteNonce(depositor: string): string {
  const timestamp = Date.now();
  const encoded = utils.defaultAbiCoder.encode(
    ["uint256", "bytes32"],
    [timestamp, toBytes32(depositor)]
  );
  return utils.keccak256(encoded);
}
