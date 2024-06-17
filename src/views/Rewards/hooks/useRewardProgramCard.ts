import { useConnection, useRewardSummary } from "hooks";
import { getToken, rewardProgramTypes, rewardPrograms } from "utils";
import { BigNumber } from "ethers";

export function useRewardProgramCard(programName: rewardProgramTypes) {
  const { account } = useConnection();
  const programDetail = rewardPrograms[programName];
  const token = getToken(programDetail.rewardTokenSymbol);
  const { summary } = useRewardSummary(programName, account);
  const rewardsAmount =
    summary.program === "referrals"
      ? summary.rewardsAmount
      : summary.unclaimedRewards ?? 0;
  return {
    ...programDetail,
    token,
    rewardsAmount: BigNumber.from(rewardsAmount),
  };
}
