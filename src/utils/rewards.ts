import { fixedPointAdjustment, secondsPerYear } from "utils/constants";
import { safeDivide } from "utils/math";
import { BigNumber } from "ethers";
import { parseEther } from "@ethersproject/units";
import { StakingPool } from "hooks";
import _ from "lodash";
import { formattedBigNumberToNumber, parseEtherLike } from "./format";

export function getBaseRewardsApr(
  baseEmissionRatePerSecond: BigNumber,
  totalStaked: BigNumber,
  userStaked?: BigNumber
) {
  const rewardsPerYear = baseEmissionRatePerSecond.mul(secondsPerYear);

  if (totalStaked.isZero()) {
    totalStaked = BigNumber.from(1);
  }

  const baseRewardsApr = safeDivide(rewardsPerYear, totalStaked);

  if (!userStaked || userStaked.isZero()) {
    return baseRewardsApr;
  }

  return safeDivide(rewardsPerYear.mul(userStaked), totalStaked.pow(2));
}

export function deriveNewStakingValues(
  origin: StakingPool,
  lpModification?: BigNumber,
  modificationType?: "stake" | "unstake"
): StakingPool | undefined {
  if (!lpModification || lpModification.eq(0) || !modificationType) {
    return undefined;
  }

  const updatedPoolData = _.cloneDeep(origin);
  const isStake = modificationType === "stake";

  const currentlyStaked = updatedPoolData.userAmountOfLPStaked.add(
    lpModification.mul(isStake ? 1 : -1)
  );
  const noStake = currentlyStaked.eq(0);

  const updatedTimeEstimateInSeconds = noStake
    ? BigNumber.from(0)
    : isStake
    ? lpModification
        .mul(fixedPointAdjustment)
        .div(currentlyStaked)
        .mul(origin.elapsedTimeSinceAvgDeposit)
        .div(fixedPointAdjustment)
    : BigNumber.from(origin.elapsedTimeSinceAvgDeposit).mul(86400);

  const updatedTimeEstimate = updatedTimeEstimateInSeconds
    .div(86400)
    .toNumber();

  let fractionOfMaxMultiplier = updatedTimeEstimateInSeconds
    .mul(fixedPointAdjustment)
    .div(origin.secondsToMaxMultiplier);
  fractionOfMaxMultiplier = fractionOfMaxMultiplier.gt(fixedPointAdjustment)
    ? fixedPointAdjustment
    : fractionOfMaxMultiplier;

  const updatedMultiplier =
    noStake || updatedTimeEstimateInSeconds.eq(0)
      ? parseEther("1")
      : fixedPointAdjustment.add(
          fractionOfMaxMultiplier
            .mul(origin.maxMultiplier.sub(fixedPointAdjustment))
            .div(fixedPointAdjustment)
        );
  const updatedMultiplierPercentage = origin.maxMultiplier.eq(0)
    ? 0
    : formattedBigNumberToNumber(
        updatedMultiplier
          .mul(fixedPointAdjustment)
          .div(origin.maxMultiplier)
          .mul(100)
      );

  const updatedRewardsApy = origin.apyData.baseRewardsApy
    .mul(currentlyStaked.gt(0) ? updatedMultiplier : parseEtherLike("1"))
    .div(fixedPointAdjustment);

  const updatedTotalApy = origin.apyData.poolApy.add(updatedRewardsApy);

  const clonedOrigin = _.cloneDeep(origin);
  return {
    ...clonedOrigin,
    userAmountOfLPStaked: currentlyStaked,
    elapsedTimeSinceAvgDeposit: updatedTimeEstimate,
    currentUserRewardMultiplier: updatedMultiplier,
    usersMultiplierPercentage: updatedMultiplierPercentage,
    apyData: {
      ...clonedOrigin.apyData,
      rewardsApy: updatedRewardsApy,
      totalApy: updatedTotalApy,
    },
  };
}
