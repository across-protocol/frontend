import { useUnclaimedProofs } from "hooks/useUnclaimedProofs";
import { useWalletTokenImport } from "hooks/useWalletTokenImport";
import { getConfig, getToken, rewardProgramTypes, rewardPrograms } from "utils";
import { useCallback } from "react";
import { useClaimRewards } from "./useClaimReferralRewards";

export function useClaimModal(program: rewardProgramTypes) {
  const token = getToken(rewardPrograms[program].rewardTokenSymbol);
  const unclaimedProofsQuery = useUnclaimedProofs(program);
  const rewardsChainId = getConfig().getOpRewardsMerkleDistributorChainId();
  const { importTokenIntoWalletFromLookup } =
    useWalletTokenImport(rewardsChainId);
  const claimMutation = useClaimRewards(program);
  const tokenAddress = getConfig().getOpTokenAddress();
  const importTokenHandler = useCallback(
    () => importTokenIntoWalletFromLookup(tokenAddress),
    [importTokenIntoWalletFromLookup, tokenAddress]
  );

  return {
    unclaimedProofsQuery,
    claimMutation,
    importTokenHandler,
    token,
  };
}
