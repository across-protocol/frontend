import { useMutation } from "react-query";

import { getConfig } from "utils/config";
import { notificationEmitter } from "utils/notify";
import { useConnection, useIsWrongNetwork } from "hooks";

import { useUnclaimedReferralProofs } from "./useUnclaimedReferralProofs";

const config = getConfig();

export function useClaimReferralRewards() {
  const { account, signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();
  const unclaimedReferralProofsQuery = useUnclaimedReferralProofs();

  const handleClaimReferralRewards = async () => {
    if (unclaimedReferralProofsQuery.isLoading) {
      return;
    }

    if (!signer || !account) {
      throw new Error("No wallet connected");
    }

    if (
      !unclaimedReferralProofsQuery.data ||
      !unclaimedReferralProofsQuery.data.unclaimed.length
    ) {
      throw new Error("Nothing to claim");
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    const merkleDistributor = config.getMerkleDistributor(signer);

    const claims = unclaimedReferralProofsQuery.data.unclaimed.map((claim) => ({
      ...claim,
      account,
      merkleProof: claim.proof,
    }));

    const tx = await merkleDistributor.claimMulti(claims); // TODO: replace with `claimAndStake`?
    await notificationEmitter(tx.hash, notify);
  };

  return useMutation(handleClaimReferralRewards, {
    onSuccess: () => unclaimedReferralProofsQuery.refetch(),
  });
}
