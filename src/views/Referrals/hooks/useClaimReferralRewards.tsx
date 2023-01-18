import { useMutation } from "react-query";

import { getConfig } from "utils/config";
import { useConnection, useIsWrongNetwork } from "hooks";
import { useUnclaimedReferralProofs } from "./useUnclaimedReferralProofs";
import { sendWithPaddedGas } from "utils/transactions";
import { waitOnTransaction } from "utils";

const config = getConfig();

export function useClaimReferralRewards() {
  const { account, signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();
  const unclaimedReferralProofsQuery = useUnclaimedReferralProofs();

  const handleClaim = async () => {
    if (!unclaimedReferralProofsQuery?.data?.unclaimed.length) {
      return;
    }

    if (!signer || !account) {
      throw new Error("No wallet connected");
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    const merkleDistributor = config.getMerkleDistributor(signer);

    const senderFn = sendWithPaddedGas(merkleDistributor, "claimMulti");
    const claimMultiTx = await senderFn(
      unclaimedReferralProofsQuery.data.unclaimed.map((claim) => ({
        ...claim,
        merkleProof: claim.proof,
        account,
      }))
    );
    await waitOnTransaction(claimMultiTx, notify);
  };

  return useMutation(handleClaim, {
    onSuccess: () => unclaimedReferralProofsQuery.refetch(),
  });
}
