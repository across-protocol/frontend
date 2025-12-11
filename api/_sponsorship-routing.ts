import { utils } from "ethers";

import {
  getSponsoredCctpBridgeStrategy,
  isRouteSupported as isCctpRouteSupported,
} from "./_bridges/cctp-sponsored/strategy";
import {
  getOftSponsoredBridgeStrategy,
  isRouteSupported as isOftRouteSupported,
} from "./_bridges/oft-sponsored/strategy";
import { getUsdhIntentsBridgeStrategy } from "./_bridges/sponsored-intent/strategy";
import { isRouteSupported as isSponsoredIntentSupported } from "./_bridges/sponsored-intent/utils/common";
import {
  BridgeStrategy,
  BridgeStrategyDataParams,
  RoutingRule,
} from "./_bridges/types";
import {
  SponsorshipEligibilityPreChecks,
  getSponsorshipEligibilityPreChecks,
} from "./_sponsorship-eligibility";
import { getLogger, ConvertDecimals } from "./_utils";
import { Token } from "./_dexes/types";

type SponsorshipRoutingRule = RoutingRule<
  NonNullable<SponsorshipEligibilityPreChecks>
>;

// Amount threshold for routing USDC → USDH on HyperCore (in USD terms)
// Amounts >= 10K USD use CCTP, amounts < 10K USD use intents
// Note: Per-transaction limit of 1M USD is enforced in getSponsorshipEligibilityPreChecks
// Testing
const MIN_CCTP_AMOUNT_USD = 10000; // 10K USD

const makeRoutingRuleGetStrategyFn =
  (isEligibleForSponsorship: boolean) =>
  (params?: BridgeStrategyDataParams) => {
    if (!params) {
      return null;
    }

    const { inputToken, outputToken, amount, amountType } = params;

    // USDT always uses OFT with the eligibility flag
    if (inputToken.symbol?.includes("USDT")) {
      return getOftSponsoredBridgeStrategy(isEligibleForSponsorship);
    }

    // USDC routing logic
    if (inputToken.symbol?.includes("USDC")) {
      // Check if this is a USDC → USDH-SPOT route on HyperCore
      const isUsdcToUsdhSpot =
        outputToken.symbol === "USDH-SPOT" &&
        isSponsoredIntentSupported({ inputToken, outputToken });

      // If eligible for sponsorship AND USDC → USDH-SPOT, check amount
      if (isEligibleForSponsorship && isUsdcToUsdhSpot) {
        const inputAmount =
          amountType === "exactInput"
            ? amount
            : ConvertDecimals(
                outputToken.decimals,
                inputToken.decimals
              )(amount);
        const minCctpAmount = utils.parseUnits(
          MIN_CCTP_AMOUNT_USD.toString(),
          inputToken.decimals
        );

        // Route based on amount:
        // - amount >= 10K → Sponsored CCTP
        // - amount < 10K → USDH intents
        if (inputAmount.gte(minCctpAmount)) {
          return getSponsoredCctpBridgeStrategy(true);
        } else {
          return getUsdhIntentsBridgeStrategy();
        }
      }

      // Default USDC routing (not USDH-SPOT or not eligible)
      return getSponsoredCctpBridgeStrategy(isEligibleForSponsorship);
    }

    return null;
  };

// Priority-ordered routing rules for sponsorship
const SPONSORSHIP_ROUTING_RULES: SponsorshipRoutingRule[] = [
  {
    name: "is-eligible-token-pair",
    shouldApply: (data) => !data.isEligibleTokenPair,
    getStrategy: makeRoutingRuleGetStrategyFn(false),
    reason: "Not a sponsorship eligible token pair",
  },
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

  const strategy = applicableRule.getStrategy(params);

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
    isSponsoredIntentSupported(params)
  );
}
