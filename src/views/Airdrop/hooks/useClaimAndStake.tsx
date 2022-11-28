import { useMutation } from "react-query";

import { getConfig } from "utils/config";
import { notificationEmitter } from "utils/notify";
import { useConnection, useIsWrongNetwork } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useIsAirdropClaimed } from "./useIsAirdropClaimed";

const config = getConfig();

export function useClaimAndStake() {
  const airdropRecipientQuery = useAirdropRecipient();
  const isAirdropClaimedQuery = useIsAirdropClaimed();
  const { account, signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();

  const handleClaimAndStake = async () => {
    if (!airdropRecipientQuery.data) {
      return;
    }

    if (!signer || !account) {
      throw new Error("No wallet connected");
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    const claimAndStakeContract = config.getClaimAndStake(signer);

    const claimAndStakeTx = await claimAndStakeContract.claimAndStake({
      windowIndex: airdropRecipientQuery.data.windowIndex,
      amount: airdropRecipientQuery.data.amount,
      accountIndex: airdropRecipientQuery.data.accountIndex,
      merkleProof: airdropRecipientQuery.data.proof,
      account,
    });
    await notificationEmitter(claimAndStakeTx.hash, notify, 0);
  };

  return useMutation(handleClaimAndStake, {
    onSuccess: () => isAirdropClaimedQuery.refetch(),
  });
}
