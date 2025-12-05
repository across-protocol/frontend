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
import { getUsdhIntentsBridgeStrategy } from "./sponsored-intent/strategy";
import { routeMintAndBurnStrategy } from "./routing";

export const bridgeStrategies: BridgeStrategiesConfig = {
  default: getAcrossBridgeStrategy(),
  tokenPairPerToChain: {
    [CHAIN_IDs.HYPEREVM]: {
      [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
        [TOKEN_SYMBOLS_MAP.USDH.symbol]: getUsdhIntentsBridgeStrategy(),
      },
      // NOTE: Disable origin BSC until we have an easier way to rebalance off BSC
      // [TOKEN_SYMBOLS_MAP["USDC-BNB"].symbol]: {
      //   [TOKEN_SYMBOLS_MAP.USDH.symbol]: getUsdhIntentsBridgeStrategy(),
      // },
    },
    [CHAIN_IDs.HYPERCORE]: {
      [TOKEN_SYMBOLS_MAP.USDC.symbol]: {
        [TOKEN_SYMBOLS_MAP["USDH-SPOT"].symbol]: getUsdhIntentsBridgeStrategy(),
      },
      // NOTE: Disable origin BSC until we have an easier way to rebalance off BSC
      // [TOKEN_SYMBOLS_MAP["USDC-BNB"].symbol]: {
      //   [TOKEN_SYMBOLS_MAP["USDH-SPOT"].symbol]: getUsdhIntentsBridgeStrategy(),
      // },
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
    USDT: {
      // @TODO: Remove this once we can correctly route via eligibility checks.
      // Currently we are using hardcoded true for eligibility checks.
      [CHAIN_IDs.ARBITRUM]: {
        [CHAIN_IDs.HYPERCORE]: getOftSponsoredBridgeStrategy(true),
      },
    },
    USDC: {
      // Testnet routes
      [CHAIN_IDs.HYPEREVM_TESTNET]: {
        [CHAIN_IDs.HYPERCORE_TESTNET]: getCctpBridgeStrategy(),
      },
      [CHAIN_IDs.SEPOLIA]: {
        [CHAIN_IDs.HYPERCORE_TESTNET]: getCctpBridgeStrategy(),
      },
      // @TODO: Remove this once we can correctly route via eligibility checks.
      // Currently we are using hardcoded true for eligibility checks.
      [CHAIN_IDs.ARBITRUM_SEPOLIA]: {
        [CHAIN_IDs.HYPERCORE_TESTNET]: getSponsoredCctpBridgeStrategy(true),
      },
      [CHAIN_IDs.ARBITRUM]: {
        [CHAIN_IDs.HYPERCORE]: getSponsoredCctpBridgeStrategy(true),
      },
      // SVM → HyperCore routes
      [CHAIN_IDs.SOLANA]: {
        [CHAIN_IDs.HYPERCORE]: getCctpBridgeStrategy(),
      },
      // @TODO: Remove this once we can correctly route via eligibility checks.
      // Currently we are using hardcoded true for eligibility checks.
      [CHAIN_IDs.SOLANA_DEVNET]: {
        [CHAIN_IDs.HYPERCORE_TESTNET]: getSponsoredCctpBridgeStrategy(true),
      },
    },
  },
};

export const routableBridgeStrategies = [
  getAcrossBridgeStrategy(),
  getCctpBridgeStrategy(),
  getOftBridgeStrategy(),
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
  routingPreference = "default",
}: GetBridgeStrategyParams): Promise<BridgeStrategy> {
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

  // Always use Across when actions are present
  if (includesActions) {
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
