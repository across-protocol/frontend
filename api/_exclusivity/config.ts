import config from "../../src/data/exclusive-relayer-configs.json";
import strategyConfig from "../../src/data/exclusivity-strategy.json";
import { RelayerConfig, RelayerSelector } from "./types";
import { none, weightedRandom } from "./strategies";

// Absolute minimum exclusivity to set for any given transfer.
const DEFAULT_MIN_EXCLUSIVITY = 3;

/**
 * Object mapping named exclusivity strategies to their implementation.
 */
const EXCLUSIVITY_STRATEGIES = {
  none,
  weightedRandom,
} as const;
type ExclusivityStrategy = keyof typeof EXCLUSIVITY_STRATEGIES;
type StrategyConfigTokenKey = keyof typeof strategyConfig.tokens;

/**
 * Select a specific relayer exclusivity strategy to apply based on provided configuration.
 * @returns A handler function that will narrow an array of relayers to a single address
 */
export function getStrategy(
  outputTokenSymbol: string,
  destinationChainId: number
): { name: string; selectorFn: RelayerSelector } {
  // FIXME: Typecasting is a bit messy here.
  const tokenConfig =
    strategyConfig.tokens?.[outputTokenSymbol as StrategyConfigTokenKey] ?? {};
  // FIXME: Typecasting is a bit messy here.
  const tokenDestConfig = (
    tokenConfig?.destinationChainIds as Record<
      string,
      | "none"
      | {
          strategy: ExclusivityStrategy;
          weight: number;
        }
    >
  )?.[String(destinationChainId)];

  let strategy = (tokenConfig.default ??
    strategyConfig.default) as ExclusivityStrategy;

  // Strategy is defined at the token > destination chain level with a weight.
  if (
    typeof tokenDestConfig === "object" &&
    tokenDestConfig.strategy &&
    tokenDestConfig.weight
  ) {
    strategy =
      Math.random() <= tokenDestConfig.weight
        ? tokenDestConfig.strategy
        : strategy;
  }
  // Strategy is defined at the token > destination chain level without a weight.
  else if (typeof tokenDestConfig === "string") {
    strategy = tokenDestConfig;
  }

  return {
    name: strategy,
    selectorFn: EXCLUSIVITY_STRATEGIES[strategy],
  };
}

/**
 * For a given deposit, identify the set of relayers that are eligible for exclusivity.
 * @param originChainId Origin chain of deposit.
 * @returns An array of relayer addresses & associated configuration.
 */
export function getRelayerConfig(originChainId: number): RelayerConfig[] {
  const relayers = Object.entries(config)
    .filter(([, relayerConfig]) =>
      relayerConfig?.originChainIds?.includes(originChainId)
    )
    .map(([address, config]) => ({
      address,
      ...config,
    }));

  return relayers;
}

/**
 * Compute the net exclusivity period to apply for a given route.
 * @note This may be subject to the value of the transfer in future.
 * @returns The net period of exclusivity to be applied for a given route.
 */
export function getExclusivityPeriod(estimatedFillTimeSec: number): number {
  return Math.max(estimatedFillTimeSec, DEFAULT_MIN_EXCLUSIVITY);
}
