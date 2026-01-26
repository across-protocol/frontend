import { BigNumber } from "ethers";
import { describe, expect, it } from "vitest";
import { calculateElapsedDays } from "./staking-pool";

describe("calculateElapsedDays", () => {
  it("returns 0 when user has no staked LP tokens", () => {
    const userAmountOfLPStaked = BigNumber.from(0);
    const averageDepositTime = BigNumber.from(86400);

    const result = calculateElapsedDays(
      userAmountOfLPStaked,
      averageDepositTime
    );

    expect(result).toBe(0);
  });

  it("returns valid days for values under 1000 days", () => {
    const userAmountOfLPStaked = BigNumber.from("1000000000000000000");
    const averageDepositTime = BigNumber.from(73137000); // ~846 days

    const result = calculateElapsedDays(
      userAmountOfLPStaked,
      averageDepositTime
    );

    expect(result).toBeCloseTo(846.49, 1);
    expect(Number.isNaN(result)).toBe(false);
  });

  it("returns valid days for values at exactly 1000 days (regression test for NaN bug)", () => {
    const userAmountOfLPStaked = BigNumber.from("1000000000000000000");
    const averageDepositTime = BigNumber.from(86400000); // exactly 1000 days

    const result = calculateElapsedDays(
      userAmountOfLPStaked,
      averageDepositTime
    );

    expect(result).toBe(1000);
    expect(Number.isNaN(result)).toBe(false);
  });

  it("returns valid days for values over 1000 days (regression test for NaN bug)", () => {
    const userAmountOfLPStaked = BigNumber.from("1000000000000000000");
    const averageDepositTime = BigNumber.from(100000000); // ~1157 days

    const result = calculateElapsedDays(
      userAmountOfLPStaked,
      averageDepositTime
    );

    expect(result).toBeCloseTo(1157.41, 1);
    expect(Number.isNaN(result)).toBe(false);
  });
});
