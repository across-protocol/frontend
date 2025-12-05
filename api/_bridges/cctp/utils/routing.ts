import { getAcrossBridgeStrategy } from "../../across/strategy";
import { getCctpBridgeStrategy } from "../strategy";
import { getOftBridgeStrategy } from "../../oft/strategy";
import {
  BridgeStrategy,
  BridgeStrategyData,
  BridgeStrategyDataParams,
} from "../../types";
import { getBridgeStrategyData } from "../../utils";
import { getLogger } from "../../../_utils";

/**
 * Determines the optimal mint-and-burn bridge strategy (CCTP/OFT) for a given route.
 *
 * @param params - Bridge strategy data parameters including tokens, amounts, and addresses
 * @returns The selected bridge strategy, or null to pass to next routing function
 */
export async function routeMintAndBurnStrategy(
  params: BridgeStrategyDataParams
): Promise<BridgeStrategy | null> {
  const logger = getLogger();
  const bridgeStrategyData = await getBridgeStrategyData(params);

  if (!bridgeStrategyData) {
    logger.debug({
      at: "routeMintAndBurnStrategy",
      message:
        "Failed to fetch bridge strategy data, defaulting to Across routing",
      inputToken: params.inputToken.symbol,
      outputToken: params.outputToken.symbol,
    });
    return getAcrossBridgeStrategy();
  }

  const decision = decideBurnAndMintStrategy(bridgeStrategyData);

  logger.debug({
    at: "routeMintAndBurnStrategy",
    message: "Bridge routing decision",
    rule: decision.rule,
    reason: decision.reason,
    strategy: decision.strategy.name,
    inputToken: params.inputToken.symbol,
    outputToken: params.outputToken.symbol,
    bridgeStrategyData,
  });

  return decision.strategy;
}

function decideBurnAndMintStrategy(data: NonNullable<BridgeStrategyData>): {
  strategy: BridgeStrategy;
  rule: string;
  reason: string;
} {
  const acrossStrategy = getAcrossBridgeStrategy();
  const burnAndMintStrategy = getBurnAndMintStrategy(data);

  if (!data.isUsdcToUsdc && !data.isUsdtToUsdt) {
    return {
      strategy: acrossStrategy,
      rule: "non-mintable-route",
      reason: "Non-USDC/USDT pairs always use Across",
    };
  }

  if (data.isMonadTransfer) {
    if (data.isWithinMonadLimit) {
      return {
        strategy: acrossStrategy,
        rule: "monad-within-limit",
        reason: "Monad routes within the lite limit use Across",
      };
    }

    if (data.isUsdtToUsdt) {
      return {
        strategy: getOftBridgeStrategy(),
        rule: "monad-usdt-route",
        reason: "Monad USDT routes burn/mint via OFT",
      };
    }

    if (data.isUsdcToUsdc) {
      return {
        strategy: getCctpBridgeStrategy(),
        rule: "monad-usdc-route",
        reason: "Monad USDC routes burn/mint via CCTP",
      };
    }

    return {
      strategy: acrossStrategy,
      rule: "monad-default",
      reason: "Fallback to Across for unsupported Monad pairs",
    };
  }

  if (data.isUtilizationHigh) {
    return {
      strategy: burnAndMintStrategy,
      rule: "high-utilization",
      reason: "High utilization (>80%) routes to burn-and-mint bridges",
    };
  }

  if (data.isFastCctpEligible) {
    if (data.isInThreshold || data.isLargeCctpDeposit) {
      return {
        strategy: acrossStrategy,
        rule: "fast-cctp-small-or-large",
        reason:
          "Fast CCTP chains use Across for <$10K or >$1M deposits to manage liquidity",
      };
    }

    return {
      strategy: burnAndMintStrategy,
      rule: "fast-cctp-medium",
      reason:
        "Fast CCTP chains use burn-and-mint bridges for medium-sized deposits",
    };
  }

  if (data.canFillInstantly) {
    return {
      strategy: acrossStrategy,
      rule: "instant-fill",
      reason: "Instant fills prioritize Across for the fastest UX",
    };
  }

  if (data.isUsdcToUsdc && data.isLargeCctpDeposit) {
    return {
      strategy: acrossStrategy,
      rule: "large-cctp-deposit",
      reason: "Large USDC deposits (>$1M) remain on Across for capacity",
    };
  }

  return {
    strategy: burnAndMintStrategy,
    rule: "default-burn-and-mint",
    reason: "Default to burn-and-mint bridges for remaining USDC/USDT routes",
  };
}

function getBurnAndMintStrategy(
  data: NonNullable<BridgeStrategyData>
): BridgeStrategy {
  if (data.isUsdcToUsdc) {
    return getCctpBridgeStrategy();
  }

  if (data.isUsdtToUsdt) {
    return getOftBridgeStrategy();
  }

  return getAcrossBridgeStrategy();
}
