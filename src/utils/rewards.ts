import { fixedPointAdjustment, secondsPerDay } from "utils/constants";
import { safeDivide } from "utils/math";
import { BigNumber } from "ethers";
import { parseEther } from "@ethersproject/units";
import { StakingPool } from "hooks";
import { formattedBigNumberToNumber, parseEtherLike } from "./format";
import { cloneDeep } from "lodash";

export function getBaseRewardsApr(
  rewardsPerYearInUSD: BigNumber,
  totalStakedInUSD: BigNumber
) {
  if (totalStakedInUSD.isZero()) {
    totalStakedInUSD = parseEther("1");
  }

  return safeDivide(
    rewardsPerYearInUSD.mul(fixedPointAdjustment),
    totalStakedInUSD
  );
}

/**
 * Generates an updated staking value depending on the configuration of an origin StakingPool data resolved from the AcceleratingDistributor contract
 * @param origin The current configuration of a given staking pool. This data will not be modified
 * @param lpModification The amount of LP tokens that will either be staked or unstaked
 * @param modificationType An enumerated value of whether or not the `lpModification` value will be staked or unstaked from the origin
 * @returns A modified `StakingPool` configuration with an updated APY/Reward configuration depending on the staking action & amount
 */
export function deriveNewStakingValues(
  origin: StakingPool,
  lpModification?: BigNumber,
  modificationType?: "stake" | "unstake"
): StakingPool | undefined {
  // If the user does not pass any staking data, return undefined
  if (!lpModification || lpModification.eq(0) || !modificationType) {
    return undefined;
  }
  // Clone all aspects of the origin so that there's no chance we can
  // modify the initial input.
  const clonedOrigin = cloneDeep(origin);

  // Resolve a boolean for if the user is staking or not
  const isStake = modificationType === "stake";
  // Resolve the new staked amount based on the lpConfiguration/staking Action
  const currentlyStaked = origin.userAmountOfLPStaked.add(
    lpModification.mul(isStake ? 1 : -1)
  );
  // Resolve if the user has effectively unstaked under this new configuration
  const noStake = currentlyStaked.eq(0);

  // If the non-maximum unstake action is requested, the return should mirror
  // the origin
  if (!noStake && !isStake) {
    return clonedOrigin;
  }

  // Update the total amount of time the user has staked weighted on this new
  // stake/unstake action
  const currentSecondsElapsedSinceAvgDeposit = BigNumber.from(
    Math.floor(origin.elapsedTimeSinceAvgDeposit * secondsPerDay)
  );
  const updatedTimeEstimateInSeconds = noStake
    ? BigNumber.from(0) // If the user has no stake, their time is 0
    : isStake // The user wants to stake
    ? currentSecondsElapsedSinceAvgDeposit.sub(
        lpModification
          .mul(fixedPointAdjustment)
          .div(currentlyStaked)
          .mul(currentSecondsElapsedSinceAvgDeposit)
          .div(fixedPointAdjustment)
      )
    : BigNumber.from(currentSecondsElapsedSinceAvgDeposit); // The user wishes to unstake - the elapsed time does not change

  // Resolve the total amount of time in days that the user would have now staked
  const updatedTimeEstimate =
    updatedTimeEstimateInSeconds.toNumber() / secondsPerDay;

  // Generate a fractional amount of how much time the user has staked with respect
  // to the total number of seconds that a stake needs to exist to claim the maximum
  // reward multiplier
  let fractionOfMaxMultiplier = updatedTimeEstimateInSeconds
    .mul(fixedPointAdjustment)
    .div(origin.secondsToMaxMultiplier);
  // Cap the fractional percent at 1.0
  fractionOfMaxMultiplier = fractionOfMaxMultiplier.gt(fixedPointAdjustment)
    ? fixedPointAdjustment
    : fractionOfMaxMultiplier;

  // Use the fractional amount to resolve the new multplier that the user has at
  // receiving additional % on their staking reward APY
  const updatedMultiplier =
    noStake || updatedTimeEstimateInSeconds.eq(0)
      ? parseEther("1")
      : fixedPointAdjustment.add(
          fractionOfMaxMultiplier
            .mul(origin.maxMultiplier.sub(fixedPointAdjustment))
            .div(fixedPointAdjustment)
        );
  // Convert the new multplier into a percentage of it and the
  // maximum multiplier
  const updatedMultiplierPercentage = origin.maxMultiplier.eq(0)
    ? 0
    : formattedBigNumberToNumber(
        updatedMultiplier
          .mul(fixedPointAdjustment)
          .div(origin.maxMultiplier)
          .mul(100)
      );

  // Regenerate the max and min APY values
  const updatedMaxApy = origin.apyData.poolApy.add(
    origin.apyData.baseRewardsApy
      .mul(origin.maxMultiplier)
      .div(fixedPointAdjustment)
  );
  const updatedMinApy = origin.apyData.poolApy.add(
    origin.apyData.baseRewardsApy
  );

  // Resolve the new Rewards APY (base stakingAPY * multiplier)
  const updatedRewardsApy = origin.apyData.baseRewardsApy
    .mul(currentlyStaked.gt(0) ? updatedMultiplier : parseEtherLike("1"))
    .div(fixedPointAdjustment);

  // Resolve the new total APY (pool APY + rewards APY)
  const updatedTotalApy = origin.apyData.poolApy.add(updatedRewardsApy);

  // Return the new configuration values with the origin values padded
  // to fill the rest of the data
  return {
    ...clonedOrigin,
    userAmountOfLPStaked: currentlyStaked,
    elapsedTimeSinceAvgDeposit: updatedTimeEstimate,
    currentUserRewardMultiplier: updatedMultiplier,
    usersMultiplierPercentage: updatedMultiplierPercentage,
    apyData: {
      ...origin.apyData,
      rewardsApy: updatedRewardsApy,
      totalApy: updatedTotalApy,
      maxApy: updatedMaxApy,
      minApy: updatedMinApy,
    },
  };
}
