import { BigNumber } from "ethers";
import timings from "../src/data/fill-times-preset.json";
import exclusivityTimings from "../src/data/exclusivity-fill-times.json";
import { parseUnits } from "ethers/lib/utils";
import { CHAIN_IDs } from "./_constants";

const bigNumberComparator = (a: BigNumber, b: BigNumber) =>
  a.lt(b) ? -1 : a.gt(b) ? 1 : 0;

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

const timingsLookup = makeLookup(timings);
const exclusivityTimingsLookup = makeLookup(exclusivityTimings);

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

    const sourceData = timingsLookup[sourceChainId] ?? timingsLookup["0"];
    const destinationData =
      sourceData?.[destinationChainId] ?? sourceData?.["0"];
    const symbolData = destinationData?.[symbol] ?? destinationData?.["OTHER"]; // implicitly sorted
    return (
      symbolData?.find((cutoff) => usdAmount.lt(cutoff.amountUsd))
        ?.timingInSecs ?? 10
    );
  };
}

function makeLookup(rawTimings: typeof timings) {
  return rawTimings
    .map((timing) => ({
      p75_fill_time_secs: Number(timing.p75_fill_time_secs),
      max_size_usd: parseUnits(timing.max_size_usd, 18),
      destination_route_classification:
        timing.destination_route_classification.split(","),
      origin_route_classification:
        timing.origin_route_classification?.split(","),
      token_liquidity_groups: timing.token_liquidity_groups
        .split(",")
        .map((s) => s.toUpperCase()),
    }))
    .reduce(
      (acc, timing) => {
        timing.origin_route_classification.forEach((srcId) => {
          timing.destination_route_classification.forEach((dstId) => {
            timing.token_liquidity_groups.forEach((symbol) => {
              acc[srcId] ??= {};
              acc[srcId][dstId] ??= {};
              acc[srcId][dstId][symbol] ??= [];
              acc[srcId][dstId][symbol].push({
                amountUsd: timing.max_size_usd,
                timingInSecs: timing.p75_fill_time_secs,
              });
              // Sort inline
              acc[srcId][dstId][symbol].sort((a, b) =>
                bigNumberComparator(a.amountUsd, b.amountUsd)
              );
            });
          });
        });
        return acc;
      },
      {} as {
        [srcId: string]: {
          [dstId: string]: {
            [symbol: string]: {
              amountUsd: BigNumber;
              timingInSecs: number;
            }[];
          };
        };
      }
    );
}
