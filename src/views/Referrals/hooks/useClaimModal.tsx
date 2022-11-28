import { useUnclaimedReferralProofs } from "./useUnclaimedReferralProofs";
import { useClaimReferralRewards } from "./useClaimReferralRewards";
import { useWalletTokenImport } from "hooks/useWalletTokenImport";
import { getConfig } from "utils";

export function useClaimModal() {
  const unclaimedReferralProofsQuery = useUnclaimedReferralProofs();
  const claimMutation = useClaimReferralRewards();
  const { importTokenIntoWalletFromLookup } = useWalletTokenImport();

  const importTokenHandler = () => {
    importTokenIntoWalletFromLookup(getConfig().getAcrossTokenAddress());
  };

  return { unclaimedReferralProofsQuery, claimMutation, importTokenHandler };
}
