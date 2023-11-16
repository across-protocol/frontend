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

export function useGenericRewardClaimCard(program: rewardProgramTypes) {
  const { account } = useConnection();
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

  return {
    ...programDetails,
    token,
    rewardsAmount: BigNumber.from(rewardsAmount),
    unclaimedAmount:
      unclaimedReferralData?.claimableAmount ?? BigNumber.from(0),
    formatUnits,
  };
}
