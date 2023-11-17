import { BigNumber } from "ethers";
import { useConnection, useReferralSummary } from "hooks";
import { useUnclaimedReferralProofs } from "hooks/useUnclaimedReferralProofs";
import { useMemo } from "react";
import {
  formatUnitsFnBuilder,
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
  const { programDetails, token } = useMemo(
    () => ({
      programDetails: rewardPrograms[program],
      token: getToken(rewardPrograms[program].rewardTokenSymbol),
    }),
    [program]
  );
  const {
    summary: { rewardsAmount },
  } = useReferralSummary(account);
  const { data: unclaimedReferralData } = useUnclaimedReferralProofs();
  const formatUnits = formatUnitsFnBuilder(token.decimals);

  // TODO: add a state for OP rewards and a state for referral rewards
  const disconnectedState: GenericRewardClaimCardDisconnectedStateProps = {
    title: "Refer and earn",
    description:
      "Join the referral program and earn a portion of fees in ACX for transfers made from your unique referral link.",
    learnMoreLink:
      "https://docs.across.to/how-to-use-across/rewards/referral-rewards#how-to-earn-referral-rewards",
  };

  return {
    ...programDetails,
    token,
    rewardsAmount: BigNumber.from(rewardsAmount),
    unclaimedAmount:
      unclaimedReferralData?.claimableAmount ?? BigNumber.from(0),
    formatUnits,
    disconnectedState,
    isConnected,
  };
}
