import { getAcrossBridgeStrategy } from "./across/strategy";
import { getHyperCoreBridgeStrategy } from "./hypercore/strategy";
import {
  BridgeStrategiesConfig,
  BridgeStrategy,
  GetBridgeStrategyParams,
  RouteStrategyFunction,
} from "./types";
import { CHAIN_IDs } from "../_constants";
import { getCctpBridgeStrategy } from "./cctp/strategy";
import { routeStrategyForCctp } from "./cctp/utils/routing";
import { routeStrategyForSponsorship } from "../_sponsorship-routing";
import { getSponsoredCctpBridgeStrategy } from "./cctp-sponsored/strategy";

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
      // Testnet routes
      [CHAIN_IDs.HYPEREVM_TESTNET]: {
        [CHAIN_IDs.HYPERCORE_TESTNET]: getCctpBridgeStrategy(),
      },
      [CHAIN_IDs.SEPOLIA]: {
        [CHAIN_IDs.HYPERCORE_TESTNET]: getCctpBridgeStrategy(),
      },
      [CHAIN_IDs.ARBITRUM_SEPOLIA]: {
        // @TODO: Remove this once we can correctly route via eligibility checks
        [CHAIN_IDs.HYPERCORE_TESTNET]: getSponsoredCctpBridgeStrategy(),
      },
      // SVM → HyperCore routes
      [CHAIN_IDs.SOLANA]: {
        [CHAIN_IDs.HYPERCORE]: getCctpBridgeStrategy(),
      },
      [CHAIN_IDs.SOLANA_DEVNET]: {
        [CHAIN_IDs.HYPERCORE_TESTNET]: getCctpBridgeStrategy(),
      },
    },
  },
};

export const routableBridgeStrategies = [
  getAcrossBridgeStrategy(),
  getCctpBridgeStrategy(),
];

// Priority-ordered routing strategies
const ROUTING_STRATEGIES: RouteStrategyFunction[] = [
  routeStrategyForSponsorship,
  routeStrategyForCctp,
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
  routingPreference = "default",
}: GetBridgeStrategyParams): Promise<BridgeStrategy> {
  const inputTokenOverride =
    bridgeStrategies.inputTokens?.[inputToken.symbol]?.[originChainId]?.[
      destinationChainId
    ];
  if (inputTokenOverride) {
    return inputTokenOverride;
  }

  const fromToChainOverride =
    bridgeStrategies.fromToChains?.[originChainId]?.[destinationChainId];
  if (fromToChainOverride) {
    return fromToChainOverride;
  }

  const supportedBridgeStrategies = getSupportedBridgeStrategies({
    inputToken,
    outputToken,
    routingPreference,
  });

  if (supportedBridgeStrategies.length === 1) {
    return supportedBridgeStrategies[0];
  }

  for (const routeStrategy of ROUTING_STRATEGIES) {
    const strategy = await routeStrategy({
      inputToken,
      outputToken,
      amount,
      amountType,
      recipient,
      depositor,
    });

    if (
      strategy &&
      supportedBridgeStrategies.some((s) => s.name === strategy.name)
    ) {
      return strategy;
    }
  }

  return getAcrossBridgeStrategy();
}

export function getSupportedBridgeStrategies({
  inputToken,
  outputToken,
  routingPreference,
}: {
  inputToken: GetBridgeStrategyParams["inputToken"];
  outputToken: GetBridgeStrategyParams["outputToken"];
  routingPreference: string;
}) {
  const routingPreferenceFilter = (strategyName: string) => {
    // If default routing preference, don't filter based on name
    if (routingPreference === "default") {
      return true;
    }

    // If native routing preference, filter out 'across' bridge strategy
    if (routingPreference === "native") {
      return strategyName !== "across";
    }

    // Else use across bridge strategy
    return strategyName === "across";
  };
  const supportedBridgeStrategies = routableBridgeStrategies.filter(
    (strategy) =>
      strategy.isRouteSupported({ inputToken, outputToken }) &&
      routingPreferenceFilter(strategy.name)
  );
  return supportedBridgeStrategies;
}
