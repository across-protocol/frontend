import { useUnclaimedReferralProofs } from "hooks/useUnclaimedReferralProofs";
import { useWalletTokenImport } from "hooks/useWalletTokenImport";
import { getConfig, getToken, rewardProgramTypes, rewardPrograms } from "utils";
import { useCallback } from "react";
import { useClaimReferralRewards } from "./useClaimReferralRewards";

export function useClaimModal(program: rewardProgramTypes) {
  const token = getToken(rewardPrograms[program].rewardTokenSymbol);

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
    token,
  };
}
