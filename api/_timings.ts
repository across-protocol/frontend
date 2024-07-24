import { BigNumber } from "ethers";
import timings from "../src/data/fill-times-preset.json";
import { parseUnits } from "ethers/lib/utils";

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
  const sourceData = timingsLookup[sourceChainId] ?? timingsLookup["OTHER"];
  const destinationData = sourceData[destinationChainId] ?? sourceData["OTHER"];
  const symbolData = destinationData[symbol] ?? destinationData["OTHER"];
  const sortedCutoffs = symbolData.sort(
    ({ amountUsd: amountUsdA }, { amountUsd: amountUsdB }) =>
      amountUsdA.lt(amountUsdB) ? -1 : amountUsdA.gt(amountUsdB) ? 1 : 0
  );
  return (
    sortedCutoffs.find((cutoff) => usdAmount.lt(cutoff.amountUsd))
      ?.timingInSecs ?? 10
  );
}
