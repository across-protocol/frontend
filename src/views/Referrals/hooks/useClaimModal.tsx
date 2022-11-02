import { useUnclaimedReferralProofs } from "./useUnclaimedReferralProofs";
import { useClaimReferralRewards } from "./useClaimReferralRewards";

export function useClaimModal() {
  const unclaimedReferralProofsQuery = useUnclaimedReferralProofs();
  const claimMutation = useClaimReferralRewards();

  return { unclaimedReferralProofsQuery, claimMutation };
}
