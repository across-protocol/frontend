import {
  getSponsoredCctpBridgeStrategy,
  isRouteSupported as isCctpRouteSupported,
} from "./_bridges/cctp-sponsored/strategy";
import {
  getOftSponsoredBridgeStrategy,
  isRouteSupported as isOftRouteSupported,
} from "./_bridges/oft-sponsored/strategy";
import {
  BridgeStrategy,
  BridgeStrategyDataParams,
  RoutingRule,
} from "./_bridges/types";
import {
  SponsorshipEligibilityPreChecks,
  getSponsorshipEligibilityPreChecks,
} from "./_sponsorship-eligibility";
import { getLogger } from "./_utils";
import { Token } from "./_dexes/types";

type SponsorshipRoutingRule = RoutingRule<
  NonNullable<SponsorshipEligibilityPreChecks>
>;

const makeRoutingRuleGetStrategyFn =
  (isEligibleForSponsorship: boolean) => (inputToken?: Token) => {
    if (inputToken?.symbol?.includes("USDT")) {
      return getOftSponsoredBridgeStrategy(isEligibleForSponsorship);
    } else if (inputToken?.symbol?.includes("USDC")) {
      return getSponsoredCctpBridgeStrategy(isEligibleForSponsorship);
    }
    return null;
  };

// Priority-ordered routing rules for sponsorship
const SPONSORSHIP_ROUTING_RULES: SponsorshipRoutingRule[] = [
  {
    name: "global-limit-exceeded",
    shouldApply: (data) => !data.isWithinGlobalDailyLimit,
    getStrategy: makeRoutingRuleGetStrategyFn(false),
    reason: "Global daily sponsorship limit exceeded",
  },
  {
    name: "user-limit-exceeded",
    shouldApply: (data) => !data.isWithinUserDailyLimit,
    getStrategy: makeRoutingRuleGetStrategyFn(false),
    reason: "User daily sponsorship limit exceeded",
  },
  {
    name: "account-creation-limit-exceeded",
    shouldApply: (data) => !data.isWithinAccountCreationDailyLimit,
    getStrategy: makeRoutingRuleGetStrategyFn(false),
    reason: "Account creation requirements not met",
  },
  {
    name: "eligible-for-sponsorship",
    shouldApply: (data) =>
      data.isWithinGlobalDailyLimit &&
      data.isWithinUserDailyLimit &&
      data.isWithinAccountCreationDailyLimit,
    getStrategy: makeRoutingRuleGetStrategyFn(true),
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

  if (!isSponsoredRoute(params)) {
    return null;
  }

  const eligibilityData = await getSponsorshipEligibilityPreChecks(params);

  if (!eligibilityData) {
    logger.warn({
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
    logger.warn({
      at: "routeStrategyForSponsorship",
      message:
        "No sponsorship rule matched (unexpected), passing to next router",
      eligibilityData,
    });
    return null;
  }

  const strategy = applicableRule.getStrategy(params.inputToken);

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

export function isSponsoredRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  return isCctpRouteSupported(params) || isOftRouteSupported(params);
}
