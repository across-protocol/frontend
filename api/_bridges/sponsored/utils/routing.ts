import { getSponsoredBridgeStrategy } from "../strategy";
import {
  BridgeStrategy,
  BridgeStrategyDataParams,
  RoutingRule,
} from "../../types";
import {
  getSponsorshipEligibilityData,
  SponsorshipEligibilityData,
} from "./eligibility";
import { getLogger } from "../../../_utils";

type SponsorshipRoutingRule = RoutingRule<
  NonNullable<SponsorshipEligibilityData>
>;

// Priority-ordered routing rules for sponsorship
const SPONSORSHIP_ROUTING_RULES: SponsorshipRoutingRule[] = [
  {
    name: "global-limit-exceeded",
    shouldApply: (data) => !data.isWithinGlobalDailyLimit,
    getStrategy: () => null as any, // Indicates ineligible
    reason: "Global daily sponsorship limit exceeded",
  },
  {
    name: "user-limit-exceeded",
    shouldApply: (data) => !data.isWithinUserDailyLimit,
    getStrategy: () => null as any, // Indicates ineligible
    reason: "User daily sponsorship limit exceeded",
  },
  {
    name: "insufficient-vault-balance",
    shouldApply: (data) => !data.hasVaultBalance,
    getStrategy: () => null as any, // Indicates ineligible
    reason: "Insufficient vault balance for sponsorship",
  },
  {
    name: "slippage-too-high",
    shouldApply: (data) => !data.isSlippageAcceptable,
    getStrategy: () => null as any, // Indicates ineligible
    reason: "Destination swap slippage exceeds acceptable bounds",
  },
  {
    name: "invalid-account-creation",
    shouldApply: (data) => !data.isAccountCreationValid,
    getStrategy: () => null as any, // Indicates ineligible
    reason: "Account creation requirements not met",
  },
  {
    name: "eligible-for-sponsorship",
    shouldApply: (data) =>
      data.isWithinGlobalDailyLimit &&
      data.isWithinUserDailyLimit &&
      data.hasVaultBalance &&
      data.isSlippageAcceptable &&
      data.isAccountCreationValid,
    getStrategy: getSponsoredBridgeStrategy,
    reason: "All sponsorship eligibility criteria met",
  },
];

/**
 * Determines if a bridge transaction is eligible for sponsorship.
 *
 * @param params - Bridge strategy data parameters including tokens, amounts, and addresses
 * @returns Sponsored bridge strategy if eligible, null otherwise
 */
export async function routeStrategyForSponsorship(
  params: BridgeStrategyDataParams
): Promise<BridgeStrategy | null> {
  const logger = getLogger();
  const eligibilityData = await getSponsorshipEligibilityData(params);

  if (!eligibilityData) {
    logger.debug({
      at: "routeStrategyForSponsorship",
      message: "Failed to fetch sponsorship eligibility data",
      inputToken: params.inputToken.symbol,
      outputToken: params.outputToken.symbol,
    });
    return null;
  }

  const applicableRule = SPONSORSHIP_ROUTING_RULES.find((rule) =>
    rule.shouldApply(eligibilityData)
  );

  if (!applicableRule) {
    logger.error({
      at: "routeStrategyForSponsorship",
      message:
        "No sponsorship rule matched (unexpected), passing to next router",
      eligibilityData,
    });
    return null;
  }

  const strategy = applicableRule.getStrategy();

  logger.debug({
    at: "routeStrategyForSponsorship",
    message: "Sponsorship eligibility decision",
    rule: applicableRule.name,
    reason: applicableRule.reason,
    strategy: strategy?.name || "null",
    inputToken: params.inputToken.symbol,
    outputToken: params.outputToken.symbol,
    eligibilityData,
  });

  return strategy;
}
