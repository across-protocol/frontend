import * as sdk from "@across-protocol/sdk";
import { CandidateRelayer, RelayerConfig, RelayerSelector } from "./types";
import { randomWeighted } from "./strategies";

const { CHAIN_IDs, ZERO_ADDRESS } = sdk.constants;

// Absolute minimum exclusivity to set for any given transfer.
const DEFAULT_MIN_EXCLUSIVITY = 3;

// For per-relayer configuration, filter by EXCLUSIVITY_MAX.
// const EXCLUSIVITY_MAX = 5;

/**
 * Origin finality + destination confirmation delays are used initially for testing.
 * These can likely be removed once actual per-route fill times are supplied by the data team.
 */
const DEFAULT_ORIGIN_FINALITY_DELAY = 1;
const ORIGIN_FINALITY_DELAY: { [chainId: number]: number } = {
  [CHAIN_IDs.MAINNET]: 18,
  [CHAIN_IDs.LINEA]: 1.5,
  [CHAIN_IDs.SCROLL]: 1.5,
};

const DEFAULT_DESTINATION_CONFIRMATION_DELAY = 1;
const DESTINATION_CONFIRMATION_DELAY: { [chainId: number]: number } = {
  [CHAIN_IDs.MAINNET]: 8,
  [CHAIN_IDs.LINEA]: 1.5,
  [CHAIN_IDs.SCROLL]: 1.5,
};

/**
 * Object mapping named exclusivity strategies to their implementation.
 */
const EXCLUSIVITY_STRATEGIES = {
  none: (_: CandidateRelayer[]) => ZERO_ADDRESS,
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
  const defaultStrategy = "none";
  return EXCLUSIVITY_STRATEGIES[defaultStrategy];
}

/**
 * For a given deposit, identify the set of relayers that are eligible for exlusivity.
 * @param originChainId Origin chain of deposit.
 * @param destinationChainId Destination chain of deposit.
 * @param outputToken Output token of deposit.
 * @returns An array of relayer addresses & associated configuration.
 */
export function getRelayerConfig(
  _originChainId: number,
  _destinationChainId: number,
  _outputToken: string
): RelayerConfig[] {
  // @todo: Read the relayer config based on the token + route combination.
  const relayers: RelayerConfig[] = [];
  return relayers;
}

/**
 * Compute the net exclusivity period to apply for a given route.
 * @note This may be subject to the value of the transfer in future.
 * @returns The net period of exclusivity to be applied for a given route.
 */
export function getExclusivityPeriod(
  originChainId: number,
  destinationChainId: number
): number {
  return (
    getOriginChainDelay(originChainId) +
    getDestinationChainDelay(destinationChainId) +
    DEFAULT_MIN_EXCLUSIVITY
  );
}

/**
 * Read the configured finality delay for a given origin chain.
 * @param originChainId Chain ID for the origin chain.
 * @returns The number of seconds to wait for origin chain finality.
 */
function getOriginChainDelay(originChainId: number): number {
  return ORIGIN_FINALITY_DELAY[originChainId] ?? DEFAULT_ORIGIN_FINALITY_DELAY;
}

/**
 * Read the configured confirmation delay for a given destination chain.
 * @param destinationChainId Chain ID for the destination chain.
 * @returns The number of seconds to wait for destination chain confirmation.
 */
function getDestinationChainDelay(originChainId: number): number {
  return (
    DESTINATION_CONFIRMATION_DELAY[originChainId] ??
    DEFAULT_DESTINATION_CONFIRMATION_DELAY
  );
}
