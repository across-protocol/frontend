import { useUnclaimedReferralProofs } from "hooks/useUnclaimedReferralProofs";
import { useWalletTokenImport } from "hooks/useWalletTokenImport";
import { getConfig, rewardProgramTypes } from "utils";
import { useCallback } from "react";
import { useClaimReferralRewards } from "./useClaimReferralRewards";

export function useClaimModal(_program: rewardProgramTypes) {
  // TODO: use program to determine which query to use

  const unclaimedReferralProofsQuery = useUnclaimedReferralProofs();
  const { importTokenIntoWalletFromLookup } = useWalletTokenImport();
  const claimMutation = useClaimReferralRewards();

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
