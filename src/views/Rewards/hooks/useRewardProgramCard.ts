import { useConnection, useReferralSummary } from "hooks";
import {
  getToken,
  rewardProgramTypes,
  rewardPrograms,
  rewardProgramsAvailable,
} from "utils";
import ACXCloudBackground from "assets/bg-banners/cloud-staking.svg";
import OPCloudBackground from "assets/bg-banners/op-cloud-rebate.svg";
import { BigNumber } from "ethers";

export function useRewardProgramCard(programName: rewardProgramTypes) {
  const { account } = useConnection();

  // We shouldn't hoist this into our constants, but we can
  // define it here and combine dynamically.
  const graphicalDetails: Record<rewardProgramTypes, string> = {
    "op-rebate": OPCloudBackground,
    referrals: ACXCloudBackground,
  };

  const details = Object.fromEntries(
    rewardProgramsAvailable.map((program) => [
      program,
      {
        ...rewardPrograms[program],
        backgroundUrl: graphicalDetails[program],
      },
    ])
  );

  const programDetail = details[programName];

  // TODO: Make this dynamic so that we can get other rebate tokens
  const {
    summary: { rewardsAmount },
  } = useReferralSummary(account);

  const token = getToken(programDetail.rewardTokenSymbol);

  return {
    ...programDetail,
    token,
    rewardsAmount: BigNumber.from(rewardsAmount),
  };
}
