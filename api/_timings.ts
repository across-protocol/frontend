import { BigNumber } from "ethers";
import timings from "../src/data/fill-times-preset.json";
import exclusivityTimings from "../src/data/exclusivity-fill-times.json";
import { parseUnits } from "ethers/lib/utils";
import { CHAIN_IDs } from "./_constants";

type RawTimings = Array<
  (typeof timings)[number] & {
    p50_fill_time_secs?: string;
    p75_fill_time_secs?: string;
  }
>;

const fillTimeOverrides: {
  [srcId: string]: {
    [dstId: string]: {
      [symbol: string]: number;
    };
  };
} = {};

const rebalanceTimeOverrides: {
  [dstId: string]: number;
} = {
  [CHAIN_IDs.POLYGON]: 1800, // 30 minutes
};

const CHAIN_WILDCARD = "0";
const OTHER_TOKEN = "OTHER";

const bigNumberComparator = (a: BigNumber, b: BigNumber) =>
  a.lt(b) ? -1 : a.gt(b) ? 1 : 0;

const defineOrderings = (
  sourceChainId: string,
  destinationChainId: string,
  symbol: string
) => [
  { dest: destinationChainId, orig: sourceChainId, token: symbol },
  { dest: destinationChainId, orig: sourceChainId, token: OTHER_TOKEN },
  { dest: CHAIN_WILDCARD, orig: sourceChainId, token: symbol },
  { dest: CHAIN_WILDCARD, orig: sourceChainId, token: OTHER_TOKEN },
  { dest: destinationChainId, orig: CHAIN_WILDCARD, token: symbol },
  { dest: destinationChainId, orig: CHAIN_WILDCARD, token: OTHER_TOKEN },
  { dest: CHAIN_WILDCARD, orig: CHAIN_WILDCARD, token: symbol },
  { dest: CHAIN_WILDCARD, orig: CHAIN_WILDCARD, token: OTHER_TOKEN },
];

const DEFAULT_SECONDS_TO_FILL = 10; // 10 seconds

const timingsLookup = makeLookup(timings as RawTimings);
const exclusivityTimingsLookup = makeLookup(exclusivityTimings as RawTimings);

/**
 * Resolve the estimated fill time seconds as returned by the /suggested-fees API and
 * displayed in the UI.
 */
export const resolveTiming = makeTimingResolver(timingsLookup);

/**
 * Resolve the estimated fill time seconds to be used by the exclusivity strategy.
 */
export const resolveExclusivityTiming = makeTimingResolver(
  exclusivityTimingsLookup
);

export function resolveRebalanceTiming(destinationChainId: string): number {
  return rebalanceTimeOverrides[destinationChainId] ?? 900; // 15 minutes
}

function makeTimingResolver(lookup: ReturnType<typeof makeLookup>) {
  /**
   * Resolve the timing for a given fill. This function will return the 75th percentile fill time
   * for the given source chain, destination chain, symbol, and USD amount. If no match is found,
   * the default value of 10 seconds will be returned.
   * @param sourceChainId A chain ID of the origin chain
   * @param destinationChainId A chain ID of the destination chain
   * @param symbol A symbol of the token
   * @param usdAmount A BigNumber representing the USD amount of the fill
   * @returns The 75th percentile fill time in seconds or the default value of 10 seconds
   */
  return (
    sourceChainId: string,
    destinationChainId: string,
    symbol: string,
    usdAmount: BigNumber
  ) => {
    const override =
      fillTimeOverrides[sourceChainId]?.[destinationChainId]?.[symbol];
    if (override) {
      return override;
    }

    const orderings = defineOrderings(
      sourceChainId,
      destinationChainId,
      symbol.toUpperCase()
    );

    // For each priority ordering, find the first route that matches the ordering
    // and return the 75th percentile fill time. If no match is found, continue to
    // the next priority ordering. If no match is found for any priority ordering,
    // return the default value.
    for (const { dest, orig, token } of orderings) {
      const matchedRoute = lookup.find((route) => {
        const destMatch = route.destination_route_classification.includes(dest);
        const origMatch = route.origin_route_classification.includes(orig);
        const tokenMatch = route.token_liquidity_groups.includes(token);
        const amountMatch = usdAmount.lte(route.max_size_usd);
        return destMatch && origMatch && tokenMatch && amountMatch;
      });
      if (matchedRoute) {
        return matchedRoute.fill_time_secs;
      }
    }
    // Return default value if no match is found
    return DEFAULT_SECONDS_TO_FILL;
  };
}

function makeLookup(rawTimings: RawTimings) {
  return (
    rawTimings
      .map((timing) => ({
        fill_time_secs: Number(
          timing.p75_fill_time_secs ?? timing.p50_fill_time_secs
        ),
        max_size_usd: parseUnits(timing.max_size_usd, 18),
        destination_route_classification:
          timing.destination_route_classification.split(","),
        origin_route_classification:
          timing.origin_route_classification?.split(","),
        token_liquidity_groups: timing.token_liquidity_groups
          .split(",")
          .map((s) => s.toUpperCase()),
      }))
      // Sort by max_size_usd in ascending order to ensure that the smallest usdc rows
      // are checked first
      .toSorted((a, b) => bigNumberComparator(a.max_size_usd, b.max_size_usd))
  );
}
