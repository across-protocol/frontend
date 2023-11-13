import { useConnection, useReferralSummary } from "hooks";
import {
  TokenInfo,
  rewardProgramTypes,
  rewardPrograms,
  rewardProgramsAvailable,
} from "utils";
import ACXCloudBackground from "assets/bg-banners/cloud-staking.svg";
import OPCloudBackground from "assets/bg-banners/op-cloud-rebate.svg";
import { BigNumber } from "ethers";

export function useRewardProgramCard(token: TokenInfo) {
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

  // TODO: Make this dynamic so that we can get other rebate tokens
  const {
    summary: { rewardsAmount },
  } = useReferralSummary(account);

  return {
    ...details[token.symbol],
    rewardsAmount: BigNumber.from(rewardsAmount),
  };
}
