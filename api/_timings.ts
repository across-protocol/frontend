import { BigNumber } from "ethers";
import timings from "../src/data/fill-times-preset.json";
import { parseUnits } from "ethers/lib/utils";

const bigNumberComparator = (a: BigNumber, b: BigNumber) =>
  a.lt(b) ? -1 : a.gt(b) ? 1 : 0;

const fillTimeOverrides: {
  [srcId: string]: {
    [dstId: string]: {
      [symbol: string]: number;
    };
  };
} = {};

const timingsLookup = timings
  .map((timing) => ({
    p75_fill_time_secs: Number(timing.p75_fill_time_secs),
    max_size_usd: parseUnits(timing.max_size_usd, 18),
    destination_route_classification:
      timing.destination_route_classification.split(","),
    origin_route_classification: timing.origin_route_classification?.split(","),
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

export function resolveTiming(
  sourceChainId: string,
  destinationChainId: string,
  symbol: string,
  usdAmount: BigNumber
): number {
  const override =
    fillTimeOverrides[sourceChainId]?.[destinationChainId]?.[symbol];
  if (override) {
    return override;
  }

  const sourceData = timingsLookup[sourceChainId] ?? timingsLookup["0"];
  const destinationData = sourceData[destinationChainId] ?? sourceData["0"];
  const symbolData = destinationData[symbol] ?? destinationData["OTHER"]; // implicitly sorted
  return (
    symbolData.find((cutoff) => usdAmount.lt(cutoff.amountUsd))?.timingInSecs ??
    10
  );
}
