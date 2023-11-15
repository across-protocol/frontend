import { useUnclaimedReferralProofs } from "hooks/useUnclaimedReferralProofs";
import { useWalletTokenImport } from "hooks/useWalletTokenImport";
import { getConfig, rewardProgramTypes } from "utils";
import { useClaimReferralRewards } from "./useClaimReferralRewards";
import { useCallback } from "react";

export function useClaimModal(program: rewardProgramTypes) {
  // TODO: use program to determine which query to use

  const unclaimedReferralProofsQuery = useUnclaimedReferralProofs();
  const claimMutation = useClaimReferralRewards();
  const { importTokenIntoWalletFromLookup } = useWalletTokenImport();

  const importTokenHandler = useCallback(
    () => importTokenIntoWalletFromLookup(getConfig().getAcrossTokenAddress()),
    [importTokenIntoWalletFromLookup]
  );

  return {
    unclaimedReferralProofsQuery,
    claimMutation,
    importTokenHandler,
  };
}
