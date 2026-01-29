import {
  getSponsoredCctpBridgeStrategy,
  isRouteSupported as isCctpRouteSupported,
} from "./_bridges/cctp-sponsored/strategy";
import {
  getOftSponsoredBridgeStrategy,
  isRouteSupported as isOftRouteSupported,
} from "./_bridges/oft-sponsored/strategy";
import { getHyperCoreIntentBridgeStrategy } from "./_bridges/hypercore-intent/strategy";
import { isRouteSupported as isHyperCoreIntentSupported } from "./_bridges/hypercore-intent/utils/common";
import {
  BridgeStrategy,
  BridgeStrategyDataParams,
  RoutingRule,
} from "./_bridges/types";
import { TOKEN_EQUIVALENCE_REMAPPING } from "./_constants";
import {
  SponsorshipEligibilityPreChecks,
  getSponsorshipEligibilityPreChecks,
} from "./_sponsorship-eligibility";
import { getLogger } from "./_utils";
import { Token } from "./_dexes/types";

type SponsorshipEligibilityData = NonNullable<SponsorshipEligibilityPreChecks>;

type SponsorshipRoutingRule = RoutingRule<SponsorshipEligibilityData>;

// Priority-ordered routing rules for sponsorship by route key
const SPONSORSHIP_ROUTING_RULES: Record<string, SponsorshipRoutingRule[]> = {
  "USDT:USDT-SPOT": [
    {
      name: "usdt-usdt-spot-non-sponsored",
      reason: "Non-sponsored USDT → USDT-SPOT route",
      shouldApply: (data) => data.isHyperCoreIntentSupported,
      getStrategy: () =>
        getHyperCoreIntentBridgeStrategy({
          isEligibleForSponsorship: false,
          shouldSponsorAccountCreation: false,
        }),
    },
  ],
  "USDT:*": [
    {
      name: "usdt-ineligible",
      reason: "Sponsorship limits not met for USDT route",
      shouldApply: (data) =>
        !isEligibleForSponsorship(data) && data.isOftEnabledOriginChain,
      getStrategy: () => getOftSponsoredBridgeStrategy(false),
    },
    {
      name: "usdt-eligible",
      reason: "Eligible USDT route",
      shouldApply: (data) =>
        isEligibleForSponsorship(data) && data.isOftEnabledOriginChain,
      getStrategy: () => getOftSponsoredBridgeStrategy(true),
    },
  ],
  "USDC:USDH-SPOT": [
    {
      name: "usdc-usdh-spot-cctp-over-threshold",
      reason: "Eligible USDC → USDH-SPOT route above mint/burn threshold",
      shouldApply: (data) =>
        isEligibleForSponsorship(data) &&
        data.isHyperCoreIntentSupported &&
        data.isCctpEnabledOriginChain &&
        data.isMintBurnThresholdMet,
      getStrategy: () => getSponsoredCctpBridgeStrategy(true),
    },
    {
      name: "usdc-usdh-spot-cctp-under-threshold",
      reason: "Eligible USDC → USDH-SPOT route below mint/burn threshold",
      shouldApply: (data) =>
        isEligibleForSponsorship(data) &&
        data.isHyperCoreIntentSupported &&
        data.isCctpEnabledOriginChain &&
        !data.isMintBurnThresholdMet,
      getStrategy: () =>
        getHyperCoreIntentBridgeStrategy({
          isEligibleForSponsorship: true,
          shouldSponsorAccountCreation: true,
        }),
    },
  ],
  "USDC:*": [
    {
      name: "usdc-ineligible",
      reason: "Sponsorship limits not met for USDC route",
      shouldApply: (data) => !isEligibleForSponsorship(data),
      getStrategy: () => getSponsoredCctpBridgeStrategy(false),
    },
    {
      name: "usdc-eligible-default",
      reason: "Eligible USDC route",
      shouldApply: (data) => isEligibleForSponsorship(data),
      getStrategy: () => getSponsoredCctpBridgeStrategy(true),
    },
  ],
};

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

  let applicableRule: SponsorshipRoutingRule | null = null;
  let strategy: BridgeStrategy | null = null;
  const rules = getRouteRules(params) ?? [];

  for (const rule of rules) {
    if (!rule.shouldApply(eligibilityData)) {
      continue;
    }
    const applicableStrategy = rule.getStrategy();
    if (applicableStrategy) {
      applicableRule = rule;
      strategy = applicableStrategy;
      break;
    }
  }

  if (!applicableRule || !strategy) {
    logger.warn({
      at: "routeStrategyForSponsorship",
      message:
        "No sponsorship rule matched (unexpected), passing to next router",
      eligibilityData,
    });
    return null;
  }

  logger.debug({
    at: "routeStrategyForSponsorship",
    message: "Sponsorship eligibility decision",
    rule: applicableRule.name,
    reason: applicableRule.reason,
    strategy: strategy?.name || "null",
    inputToken: params.inputToken.symbol,
    outputToken: params.outputToken.symbol,
    amount: params.amount.toString(),
    eligibilityData,
  });

  return strategy;
}

export function isSponsoredRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  return (
    isCctpRouteSupported(params) ||
    isOftRouteSupported(params) ||
    isHyperCoreIntentSupported(params)
  );
}

const ROUTE_WILDCARD_SYMBOL = "*";

function buildRouteKey(inputSymbol?: string, outputSymbol?: string) {
  return inputSymbol
    ? `${inputSymbol}:${outputSymbol ?? ROUTE_WILDCARD_SYMBOL}`
    : null;
}

function getRouteRules(params: BridgeStrategyDataParams) {
  const inputSymbol =
    TOKEN_EQUIVALENCE_REMAPPING[params.inputToken.symbol] ??
    params.inputToken.symbol;
  const exactKey = buildRouteKey(inputSymbol, params.outputToken.symbol);
  const wildcardKey = buildRouteKey(inputSymbol, ROUTE_WILDCARD_SYMBOL);
  return (
    (exactKey ? SPONSORSHIP_ROUTING_RULES[exactKey] : undefined) ??
    (wildcardKey ? SPONSORSHIP_ROUTING_RULES[wildcardKey] : undefined)
  );
}

function isEligibleForSponsorship(data: SponsorshipEligibilityData) {
  return (
    data.isWithinInputAmountLimit &&
    data.isWithinGlobalDailyLimit &&
    data.isWithinUserDailyLimit &&
    data.isWithinAccountCreationDailyLimit &&
    data.isEligibleTokenPair
  );
}
