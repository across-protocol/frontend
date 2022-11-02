import { useClaimAndStake } from "hooks/useClaimAndStake";

import { useUnclaimedReferralProofs } from "./useUnclaimedReferralProofs";

export function useClaimReferralRewards() {
  const unclaimedReferralProofsQuery = useUnclaimedReferralProofs();

  return useClaimAndStake(
    unclaimedReferralProofsQuery.data
      ? unclaimedReferralProofsQuery.data.unclaimed
      : [],
    () => unclaimedReferralProofsQuery.refetch()
  );
}
