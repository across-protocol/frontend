import { useConnection } from "hooks/useConnection";
import { useRewardSummary } from "hooks/useRewardSummary";
import { getToken, rewardProgramTypes, rewardPrograms } from "utils/constants";
import { BigNumber } from "ethers";

export function useRewardProgramCard(programName: rewardProgramTypes) {
  const { account } = useConnection();
  const { summary } = useRewardSummary(programName, account);
  const programDetail = rewardPrograms[programName];
  const token = getToken(programDetail.rewardTokenSymbol);
  const rewardsAmount = summary.unclaimedRewards ?? 0;
  return {
    ...programDetail,
    token,
    rewardsAmount: BigNumber.from(rewardsAmount),
  };
}
