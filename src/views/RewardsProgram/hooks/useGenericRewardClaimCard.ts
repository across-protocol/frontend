import { BigNumber } from "ethers";
import { useConnection, useRewardSummary } from "hooks";
import { useUnclaimedProofs } from "hooks/useUnclaimedProofs";
import {
  formatUnitsWithMaxFractionsFnBuilder,
  getToken,
  rewardProgramTypes,
  rewardPrograms,
} from "utils";

export type GenericRewardClaimCardDisconnectedStateProps = {
  title: string;
  description: string;
  learnMoreLink: string;
};

export function useGenericRewardClaimCard(program: rewardProgramTypes) {
  const { account, isConnected } = useConnection();
  const { data: unclaimedReferralData } = useUnclaimedProofs(program);
  const { programDetails, token } = {
    programDetails: rewardPrograms[program],
    token: getToken(rewardPrograms[program].rewardTokenSymbol),
  };
  const { summary } = useRewardSummary(program, account);
  const rewardsAmount =
    summary.program === "referrals"
      ? summary.rewardsAmount
      : summary.unclaimedRewards;
  const unclaimedAmount = unclaimedReferralData?.claimableAmount;

  const formatUnitsWithMaxFractions = formatUnitsWithMaxFractionsFnBuilder(
    token.decimals
  );

  // TODO: add a state for OP rewards and a state for referral rewards
  const disconnectedState: GenericRewardClaimCardDisconnectedStateProps = {
    title: "Refer and earn",
    description:
      "Join the referral program and earn a portion of fees in ACX for transfers made from your unique referral link.",
    learnMoreLink:
      "https://docs.across.to/v/user-docs/how-to-use-across/rewards/referral-rewards#how-to-earn-referral-rewards",
  };

  return {
    ...programDetails,
    token,
    rewardsAmount: BigNumber.from(rewardsAmount ?? 0),
    unclaimedAmount: BigNumber.from(unclaimedAmount ?? 0),
    formatUnitsWithMaxFractions,
    disconnectedState,
    isConnected,
  };
}
