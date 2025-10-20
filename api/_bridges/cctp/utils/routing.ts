import { getAcrossBridgeStrategy } from "../../across/strategy";
import { getCctpBridgeStrategy } from "../strategy";
import {
  BridgeStrategy,
  BridgeStrategyData,
  BridgeStrategyDataParams,
} from "../../types";
import { getBridgeStrategyData } from "../../utils";
import { getLogger } from "../../../_utils";

type RoutingRule = {
  name: string;
  priority: number;
  shouldApply: (data: NonNullable<BridgeStrategyData>) => boolean;
  getStrategy: () => BridgeStrategy;
  reason: string;
};

const ROUTING_RULES: RoutingRule[] = [
  {
    name: "non-usdc-route",
    priority: 1,
    shouldApply: (data) => !data.isUsdcToUsdc,
    getStrategy: getAcrossBridgeStrategy,
    reason: "Non-USDC pairs always use Across",
  },
  {
    name: "high-utilization",
    priority: 2,
    shouldApply: (data) => data.isUtilizationHigh,
    getStrategy: getCctpBridgeStrategy,
    reason: "High utilization (>80%) routes to CCTP",
  },
  {
    name: "linea-exclusion",
    priority: 3,
    shouldApply: (data) => data.isLineaSource,
    getStrategy: getAcrossBridgeStrategy,
    reason: "Linea source chain uses Across",
  },
  {
    name: "fast-cctp-small-deposit",
    priority: 4,
    shouldApply: (data) =>
      data.isFastCctpEligible && !data.isInThreshold && !data.isLargeDeposit,
    getStrategy: getCctpBridgeStrategy,
    reason:
      "Fast CCTP eligible chains (Polygon/BSC/Solana) use CCTP for medium deposits (>$10K, <$1M)",
  },
  {
    name: "fast-cctp-threshold-or-large",
    priority: 5,
    shouldApply: (data) =>
      data.isFastCctpEligible && (data.isInThreshold || data.isLargeDeposit),
    getStrategy: getAcrossBridgeStrategy,
    reason:
      "Fast CCTP chains use Across for very small (<$10K) or very large (>$1M) deposits",
  },
  {
    name: "instant-fill",
    priority: 6,
    shouldApply: (data) => data.canFillInstantly,
    getStrategy: getAcrossBridgeStrategy,
    reason: "Instant fills always use Across for speed",
  },
  {
    name: "large-deposit-fallback",
    priority: 7,
    shouldApply: (data) => data.isLargeDeposit,
    getStrategy: getAcrossBridgeStrategy,
    reason: "Large deposits (>$1M) use Across for better liquidity",
  },
  {
    name: "default-cctp",
    priority: 8,
    shouldApply: () => true,
    getStrategy: getCctpBridgeStrategy,
    reason: "Default to CCTP for standard USDC routes",
  },
];

/**
 * Determines the optimal bridge strategy (CCTP vs Across) for a given route.
 *
 * @param params - Bridge strategy data parameters including tokens, amounts, and addresses
 * @returns The selected bridge strategy
 */
export async function routeStrategyForCctp(
  params: BridgeStrategyDataParams
): Promise<BridgeStrategy> {
  const logger = getLogger();
  const bridgeStrategyData = await getBridgeStrategyData(params);

  if (!bridgeStrategyData) {
    logger.warn({
      at: "routeStrategyForCctp",
      message: "Failed to fetch bridge strategy data, using default",
      inputToken: params.inputToken.symbol,
      outputToken: params.outputToken.symbol,
    });
    return getAcrossBridgeStrategy();
  }

  const applicableRule = ROUTING_RULES.find((rule) =>
    rule.shouldApply(bridgeStrategyData)
  );

  if (!applicableRule) {
    logger.error({
      at: "routeStrategyForCctp",
      message: "No routing rule matched, using Across fallback",
      bridgeStrategyData,
    });
    return getAcrossBridgeStrategy();
  }

  logger.debug({
    at: "routeStrategyForCctp",
    message: "Bridge routing decision",
    rule: applicableRule.name,
    reason: applicableRule.reason,
    strategy: applicableRule.getStrategy().name,
    inputToken: params.inputToken.symbol,
    outputToken: params.outputToken.symbol,
    bridgeStrategyData,
  });

  return applicableRule.getStrategy();
}
