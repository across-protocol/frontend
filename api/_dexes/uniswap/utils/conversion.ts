import { Percent } from "@uniswap/sdk-core";

export function floatToPercent(value: number) {
  return new Percent(
    // max. slippage decimals is 2
    Number(value.toFixed(2)) * 100,
    10_000
  );
}
