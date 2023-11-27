import { useConnection, useReferralSummary } from "hooks";
import { getToken, rewardProgramTypes, rewardPrograms } from "utils";
import { BigNumber } from "ethers";

export function useRewardProgramCard(programName: rewardProgramTypes) {
  const { account } = useConnection();
  const programDetail = rewardPrograms[programName];
  const token = getToken(programDetail.rewardTokenSymbol);
  // TODO: Make this dynamic so that we can get other rebate tokens
  const {
    summary: { rewardsAmount },
  } = useReferralSummary(programName, account);
  return {
    ...programDetail,
    token,
    rewardsAmount: BigNumber.from(rewardsAmount),
  };
}
