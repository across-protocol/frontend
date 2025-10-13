import { getAcrossBridgeStrategy } from "./across/strategy";
import { getHyperCoreBridgeStrategy } from "./hypercore/strategy";
import { BridgeStrategiesConfig } from "./types";
import { CHAIN_IDs } from "../_constants";
import { getCctpBridgeStrategy } from "./cctp/strategy";

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
  inputTokens: {
    USDC: {
      [CHAIN_IDs.HYPEREVM]: {
        [CHAIN_IDs.HYPERCORE]: getCctpBridgeStrategy(),
      },
    },
  },
  // TODO: Add CCTP routes when ready
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
