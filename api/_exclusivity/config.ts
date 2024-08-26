import config from "../../src/data/exclusive-relayer-configs.json";
import { RelayerConfig, RelayerSelector } from "./types";
import { none, randomWeighted } from "./strategies";

// Absolute minimum exclusivity to set for any given transfer.
const DEFAULT_MIN_EXCLUSIVITY = 3;

/**
 * Object mapping named exclusivity strategies to their implementation.
 */
const EXCLUSIVITY_STRATEGIES = {
  none,
  randomWeighted,
} as const;

/**
 * Select a specific relayer exclusivity strategy to apply.
 * This currently hardcodes the "none" strategy, but will be updated to support additional strategies
 * and selection from on env-based configuration.
 * @returns A handler function that will narrow an array of relayers to a single address.
 */
export function getStrategy(): RelayerSelector {
  // @todo: Determine strategy based on configuration.
  const defaultStrategy = "randomWeighted";
  return EXCLUSIVITY_STRATEGIES[defaultStrategy];
}

/**
 * For a given deposit, identify the set of relayers that are eligible for exclusivity.
 * @param originChainId Origin chain of deposit.
 * @returns An array of relayer addresses & associated configuration.
 */
export function getRelayerConfig(originChainId: number): RelayerConfig[] {
  const relayers = Object.entries(config)
    .filter(
      ([, _relayerConfig]) =>
        // relayerConfig.originChains?.includes(originChainId) ?? true
        true // @todo: Update upstream spec.
    )
    .map(([address, config]) => ({
      address,
      ...config,
      originChains: [originChainId], // @todo
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
