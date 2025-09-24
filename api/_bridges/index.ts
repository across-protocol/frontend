import { getAcrossBridgeStrategy } from "./across/strategy";
import { BridgeStrategiesConfig } from "./types";

export const bridgeStrategies: BridgeStrategiesConfig = {
  default: getAcrossBridgeStrategy(),
};

// TODO: Extend the strategy selection based on more sophisticated logic when we start
// implementing burn/mint bridges.
export function getBridgeStrategy({
  originChainId,
  destinationChainId,
}: {
  originChainId: number;
  destinationChainId: number;
}) {
  const fromToChainOverride =
    bridgeStrategies.fromToChains?.[originChainId]?.[destinationChainId];
  return fromToChainOverride ?? bridgeStrategies.default;
}
