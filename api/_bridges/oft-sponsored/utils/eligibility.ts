import { BigNumber } from "ethers";
import { Token } from "../../../_dexes/types";

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
