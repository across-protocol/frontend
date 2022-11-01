import { fixedPointAdjustment, secondsPerYear } from "utils/constants";
import { safeDivide } from "utils/math";
import { BigNumber } from "ethers";

export function getBaseRewardsApr(
  baseEmissionRatePerSecond: BigNumber,
  totalStaked: BigNumber,
  userStaked?: BigNumber
) {
  const rewardsPerYear = baseEmissionRatePerSecond.mul(secondsPerYear);

  if (totalStaked.isZero()) {
    totalStaked = BigNumber.from(1);
  }

  const baseRewardsApr = safeDivide(
    rewardsPerYear.mul(fixedPointAdjustment),
    totalStaked
  );

  if (!userStaked || userStaked.isZero()) {
    return baseRewardsApr;
  }

  return safeDivide(
    rewardsPerYear.mul(userStaked).mul(fixedPointAdjustment),
    totalStaked.pow(2)
  );
}
