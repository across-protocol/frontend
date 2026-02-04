import {
  BridgeStrategiesConfig,
  BridgeStrategy,
  GetBridgeStrategyParams,
  RouteStrategyFunction,
} from "./types";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../_constants";
import { getCctpBridgeStrategy } from "./cctp/strategy";
import { routeStrategyForSponsorship } from "../_sponsorship-routing";
import { getSponsoredCctpBridgeStrategy } from "./cctp-sponsored/strategy";
import { getOftSponsoredBridgeStrategy } from "./oft-sponsored/strategy";
import { getAcrossBridgeStrategy } from "./across/strategy";
import { getOftBridgeStrategy } from "./oft/strategy";
import { getHyperCoreBridgeStrategy } from "./hypercore/strategy";
import { getHyperCoreIntentBridgeStrategy } from "./hypercore-intent/strategy";
import { routeMintAndBurnStrategy } from "./routing";

export const bridgeStrategies: BridgeStrategiesConfig = {
  default: getAcrossBridgeStrategy(),
  tokenPairPerToChain: {
    [CHAIN_IDs.HYPEREVM]: {
      [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
        [TOKEN_SYMBOLS_MAP.USDH.symbol]: getHyperCoreIntentBridgeStrategy({
          isEligibleForSponsorship: true,
          shouldSponsorAccountCreation: true,
        }),
      },
    },
    // NOTE: Disable subset of HyperCore destination routes via mint/burn routes until we
    // fully support them. We force return the Across bridge strategy here to avoid
    // routing to via our algorithm. TODO until we can enable these routes:
    // - https://linear.app/uma/issue/ACX-4895/api-return-swap-fees-for-unsponsored-flows
    [CHAIN_IDs.HYPERCORE]: {
      [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
        [TOKEN_SYMBOLS_MAP["USDT-SPOT"].symbol]: getAcrossBridgeStrategy(),
      },
      [TOKEN_SYMBOLS_MAP.USDT.symbol]: {
        [TOKEN_SYMBOLS_MAP["USDC-SPOT"].symbol]: getAcrossBridgeStrategy(),
      },
    },
  },
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
    },
  },
};

export const routableBridgeStrategies = [
  getAcrossBridgeStrategy(),
  getCctpBridgeStrategy(),
  getOftBridgeStrategy(),
  // Sponsored strategies with eligibility flag set to true
  // The actual eligibility is determined by routeStrategyForSponsorship
  getSponsoredCctpBridgeStrategy(true),
  getOftSponsoredBridgeStrategy(true),
  getHyperCoreIntentBridgeStrategy({
    isEligibleForSponsorship: true,
    shouldSponsorAccountCreation: true,
  }),
];

// Priority-ordered routing strategies
const ROUTING_STRATEGIES: RouteStrategyFunction[] = [
  routeStrategyForSponsorship,
  routeMintAndBurnStrategy,
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
  includesActions,
  includesAppFee,
  routingPreference = "default",
  sponsoredGaslessRoute,
}: GetBridgeStrategyParams): Promise<BridgeStrategy> {
  // Check for sponsored gasless eligibility (before other routing)
  if (sponsoredGaslessRoute) {
    return getAcrossBridgeStrategy({ sponsoredGaslessRoute });
  }

  const tokenPairPerRouteOverride =
    bridgeStrategies.tokenPairPerRoute?.[originChainId]?.[destinationChainId]?.[
      inputToken.symbol
    ]?.[outputToken.symbol];
  if (tokenPairPerRouteOverride) {
    return tokenPairPerRouteOverride;
  }

  const tokenPairPerToChainOverride =
    bridgeStrategies.tokenPairPerToChain?.[destinationChainId]?.[
      inputToken.symbol
    ]?.[outputToken.symbol];
  if (tokenPairPerToChainOverride) {
    return tokenPairPerToChainOverride;
  }

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

  // Always use Across when actions or app fees are present
  if (includesActions || includesAppFee) {
    return getAcrossBridgeStrategy();
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

    if (routingPreference === "sponsored-cctp") {
      return ["sponsored-cctp", "sponsored-oft"].includes(strategyName);
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
