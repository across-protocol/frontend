import { getAcrossBridgeStrategy } from "./across/strategy";
import { getHyperCoreBridgeStrategy } from "./hypercore/strategy";
import { BridgeStrategiesConfig, BridgeStrategyData } from "./types";
import { CHAIN_IDs } from "../_constants";

export const bridgeStrategies: BridgeStrategiesConfig = {
  default: getAcrossBridgeStrategy(),
  fromToChains: {
    [CHAIN_IDs.HYPEREVM]: {
      [CHAIN_IDs.HYPERCORE]: getHyperCoreBridgeStrategy(),
    },
    [CHAIN_IDs.HYPERCORE]: {
      [CHAIN_IDs.HYPEREVM]: getHyperCoreBridgeStrategy(),
    },
  },
  // TODO: Add CCTP routes when ready
};

export function getBridgeStrategy({
  originChainId,
  destinationChainId,
  bridgeStrategyData,
}: {
  originChainId: number;
  destinationChainId: number;
  bridgeStrategyData: BridgeStrategyData;
}) {
  if (!bridgeStrategyData) {
    const fromToChainOverride =
      bridgeStrategies.fromToChains?.[originChainId]?.[destinationChainId];
    return fromToChainOverride ?? bridgeStrategies.default;
  }
  if (!bridgeStrategyData.isUsdcToUsdc) {
    return getAcrossBridgeStrategy();
  }
  if (bridgeStrategyData.isUtilizationHigh) {
    return getCctpBridgeStrategy();
  }
  if (bridgeStrategyData.isLineaSource) {
    return getAcrossBridgeStrategy();
  }
  if (bridgeStrategyData.isFastCctpEligible) {
    if (bridgeStrategyData.isInThreshold) {
      return getAcrossBridgeStrategy();
    }
    if (bridgeStrategyData.isLargeDeposit) {
      return getAcrossBridgeStrategy();
    } else {
      return getCctpBridgeStrategy();
    }
  }
  if (bridgeStrategyData.canFillInstantly) {
    return getAcrossBridgeStrategy();
  } else {
    if (bridgeStrategyData.isLargeDeposit) {
      return getAcrossBridgeStrategy();
    } else {
      // Use OFT bridge if not CCTP
      return getCctpBridgeStrategy();
    }
  }
}
