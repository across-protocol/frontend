import { getAcrossBridgeStrategy } from "../../across/strategy";
import { getCctpBridgeStrategy } from "../strategy";
import {
  BridgeStrategy,
  BridgeStrategyData,
  BridgeStrategyDataParams,
  RoutingRule,
} from "../../types";
import { getBridgeStrategyData } from "../../utils";
import { getLogger } from "../../../_utils";

type CctpRoutingRule = RoutingRule<NonNullable<BridgeStrategyData>>;

// Priority-ordered routing rules for CCTP
const CCTP_ROUTING_RULES: CctpRoutingRule[] = [
  {
    name: "non-usdc-route",
    shouldApply: (data) => !data.isUsdcToUsdc,
    getStrategy: getAcrossBridgeStrategy,
    reason: "Non-USDC pairs always use Across",
  },
  {
    name: "high-utilization",
    shouldApply: (data) => data.isUtilizationHigh,
    getStrategy: getCctpBridgeStrategy,
    reason: "High utilization (>80%) routes to CCTP",
  },
  {
    name: "linea-exclusion",
    shouldApply: (data) => data.isLineaSource,
    getStrategy: getAcrossBridgeStrategy,
    reason: "Linea source chain uses Across",
  },
  {
    name: "fast-cctp-small-deposit",
    shouldApply: (data) =>
      data.isFastCctpEligible && !data.isInThreshold && !data.isLargeDeposit,
    getStrategy: getCctpBridgeStrategy,
    reason:
      "Fast CCTP eligible chains (Polygon/BSC/Solana) use CCTP for medium deposits (>$10K, <$1M)",
  },
  {
    name: "fast-cctp-threshold-or-large",
    shouldApply: (data) =>
      data.isFastCctpEligible && (data.isInThreshold || data.isLargeDeposit),
    getStrategy: getAcrossBridgeStrategy,
    reason:
      "Fast CCTP chains use Across for very small (<$10K) or very large (>$1M) deposits",
  },
  {
    name: "instant-fill",
    shouldApply: (data) => data.canFillInstantly,
    getStrategy: getAcrossBridgeStrategy,
    reason: "Instant fills always use Across for speed",
  },
  {
    name: "large-deposit-fallback",
    shouldApply: (data) => data.isLargeDeposit,
    getStrategy: getAcrossBridgeStrategy,
    reason: "Large deposits (>$1M) use Across for better liquidity",
  },
  {
    name: "default-cctp",
    shouldApply: () => true,
    getStrategy: getCctpBridgeStrategy,
    reason: "Default to CCTP for standard USDC routes",
  },
];

/**
 * Determines the optimal bridge strategy (CCTP vs Across) for a given route.
 *
 * @param params - Bridge strategy data parameters including tokens, amounts, and addresses
 * @returns The selected bridge strategy, or null to pass to next routing function
 */
export async function routeStrategyForCctp(
  params: BridgeStrategyDataParams
): Promise<BridgeStrategy | null> {
  const logger = getLogger();
  const bridgeStrategyData = await getBridgeStrategyData(params);

  if (!bridgeStrategyData) {
    logger.warn({
      at: "routeStrategyForCctp",
      message: "Failed to fetch bridge strategy data, passing to next router",
      inputToken: params.inputToken.symbol,
      outputToken: params.outputToken.symbol,
    });
    return null;
  }

  const applicableRule = CCTP_ROUTING_RULES.find((rule) =>
    rule.shouldApply(bridgeStrategyData)
  );

  if (!applicableRule) {
    logger.warn({
      at: "routeStrategyForCctp",
      message: "No routing rule matched (unexpected), passing to next router",
      bridgeStrategyData,
    });
    return null;
  }

  const strategy = applicableRule.getStrategy();

  logger.debug({
    at: "routeStrategyForCctp",
    message: "Bridge routing decision",
    rule: applicableRule.name,
    reason: applicableRule.reason,
    strategy: strategy?.name || "null",
    inputToken: params.inputToken.symbol,
    outputToken: params.outputToken.symbol,
    bridgeStrategyData,
  });

  return strategy;
}
