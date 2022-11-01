import { useMutation } from "react-query";

import { getConfig } from "utils/config";
import { notificationEmitter } from "utils/notify";
import { useConnection, useIsWrongNetwork } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useIsClaimed } from "./useIsClaimed";

const config = getConfig();

export function useClaim() {
  const { account, signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();
  const airdropRecipientQuery = useAirdropRecipient();
  const isClaimedQuery = useIsClaimed();

  const handleClaim = async () => {
    if (!signer || !account) {
      throw new Error("No wallet connected");
    }

    if (!airdropRecipientQuery.data) {
      throw new Error("Ineligible for airdrop");
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    const merkleDistributor = config.getMerkleDistributor(signer);

    const claimArgs = {
      ...airdropRecipientQuery.data,
      merkleProof: airdropRecipientQuery.data.proof,
      account,
    };

    const isValidClaim = await merkleDistributor.verifyClaim(claimArgs);

    if (!isValidClaim) {
      throw new Error("Invalid claim");
    }

    const tx = await merkleDistributor.claim(claimArgs); // TODO: replace with `claimAndStake`
    await notificationEmitter(tx.hash, notify);
  };

  return useMutation(handleClaim, {
    onSuccess: () => isClaimedQuery.refetch(),
  });
}
