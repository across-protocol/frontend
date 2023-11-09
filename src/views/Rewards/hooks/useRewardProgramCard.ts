import { useConnection, useReferralSummary } from "hooks";
import { COLORS, TokenInfo } from "utils";
import ACXCloudBackground from "assets/bg-banners/cloud-staking.svg";
import OPCloudBackground from "assets/bg-banners/op-cloud-rebate.svg";
import { BigNumber } from "ethers";

export function useRewardProgramCard(token: TokenInfo) {
  const { account } = useConnection();
  const details: Record<
    string,
    {
      programName: string;
      primaryColor: keyof typeof COLORS;
      backgroundUrl: string;
      url: string;
    }
  > = {
    ACX: {
      programName: "Across Referral Program",
      primaryColor: "aqua",
      backgroundUrl: ACXCloudBackground,
      url: "/rewards/referrals",
    },
    OP: {
      programName: "OP Rewards Program",
      primaryColor: "op-red",
      backgroundUrl: OPCloudBackground,
      url: "/rewards/op-rewards",
    },
  };

  // TODO: Make this dynamic so that we can get other rebate tokens
  const {
    summary: { rewardsAmount },
  } = useReferralSummary(account);

  return {
    ...details[token.symbol],
    rewardsAmount: BigNumber.from(rewardsAmount),
  };
}
