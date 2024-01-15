import { useMutation } from "react-query";

import { getConfig } from "utils/config";
import { useConnection, useIsWrongNetwork } from "hooks";
import { sendWithPaddedGas } from "utils/transactions";
import {
  ChainId,
  hubPoolChainId,
  rewardProgramTypes,
  waitOnTransaction,
} from "utils";
import { useUnclaimedProofs } from "hooks/useUnclaimedProofs";

const config = getConfig();

export function useClaimRewards(program: rewardProgramTypes) {
  const { account, signer, notify } = useConnection();
  const baseChainId =
    program === "referrals" ? hubPoolChainId : ChainId.OPTIMISM;
  const { isWrongNetwork, isWrongNetworkHandler } =
    useIsWrongNetwork(baseChainId);
  const unclaimedProofsQuery = useUnclaimedProofs(program);
  const handleClaim = async () => {
    if (!unclaimedProofsQuery?.data?.unclaimed.length) {
      return;
    }
    if (!signer || !account) {
      throw new Error("No wallet connected");
    }
    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }
    const merkleDistributor = config.getMerkleDistributor(program, signer);
    const senderFn = sendWithPaddedGas(merkleDistributor, "claimMulti");
    const claimMultiTx = await senderFn(
      unclaimedProofsQuery.data.unclaimed.map((claim) => ({
        ...claim,
        merkleProof: claim.proof,
        account,
      }))
    );
    await waitOnTransaction(hubPoolChainId, claimMultiTx, notify);
  };
  return useMutation(handleClaim, {
    onSuccess: () => unclaimedProofsQuery.refetch(),
  });
}
