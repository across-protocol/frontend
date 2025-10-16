import { getAcrossBridgeStrategy } from "./across/strategy";
import { getHyperCoreBridgeStrategy } from "./hypercore/strategy";
import {
  BridgeStrategiesConfig,
  BridgeStrategy,
  BridgeStrategyDataParams,
  GetBridgeStrategyParams,
} from "./types";
import { CHAIN_IDs } from "../_constants";
import { getCctpBridgeStrategy } from "./cctp/strategy";
import { getBridgeStrategyData } from "./utils";

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

export const routableBridgeStrategies = [
  getAcrossBridgeStrategy(),
  // TODO: Add CCTP bridge strategy when ready
];

export async function getBridgeStrategy({
  originChainId,
  destinationChainId,
  inputToken,
  outputToken,
  amount,
  amountType,
  recipient,
  depositor,
}: GetBridgeStrategyParams): Promise<BridgeStrategy> {
  const fromToChainOverride =
    bridgeStrategies.fromToChains?.[originChainId]?.[destinationChainId];
  if (fromToChainOverride) {
    return fromToChainOverride;
  }
  const supportedBridgeStrategies = routableBridgeStrategies.filter(
    (strategy) => strategy.isRouteSupported({ inputToken, outputToken })
  );
  if (supportedBridgeStrategies.length === 1) {
    return supportedBridgeStrategies[0];
  }
  if (
    supportedBridgeStrategies.some(
      (strategy) => strategy.name === getCctpBridgeStrategy().name
    )
  ) {
    return routeStrategyForCctp({
      inputToken,
      outputToken,
      amount,
      amountType,
      recipient,
      depositor,
    });
  }
  return getAcrossBridgeStrategy();
}

async function routeStrategyForCctp({
  inputToken,
  outputToken,
  amount,
  amountType,
  recipient,
  depositor,
}: BridgeStrategyDataParams): Promise<BridgeStrategy> {
  const bridgeStrategyData = await getBridgeStrategyData({
    inputToken,
    outputToken,
    amount,
    amountType,
    recipient,
    depositor,
  });
  if (!bridgeStrategyData) {
    return bridgeStrategies.default;
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
      return getCctpBridgeStrategy();
    }
  }
}
