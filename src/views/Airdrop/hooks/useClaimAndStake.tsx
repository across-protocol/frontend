import { useMutation } from "react-query";

import { getConfig } from "utils/config";
import { notificationEmitter } from "utils/notify";
import { useConnection, useIsWrongNetwork } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useIsAirdropClaimed } from "./useIsAirdropClaimed";
import { parseEther } from "@ethersproject/units";
import { fixedPointAdjustment } from "utils";

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
    const parameters = {
      windowIndex: airdropRecipientQuery.data.windowIndex,
      amount: airdropRecipientQuery.data.amount,
      accountIndex: airdropRecipientQuery.data.accountIndex,
      merkleProof: airdropRecipientQuery.data.proof,
      account,
    };

    const gasEstimate = await claimAndStakeContract.estimateGas.claimAndStake(
      parameters
    );

    const claimAndStakeTx = await claimAndStakeContract.claimAndStake(
      parameters,
      {
        gasLimit: gasEstimate.mul(parseEther("2.0")).div(fixedPointAdjustment),
      }
    );
    await notificationEmitter(claimAndStakeTx.hash, notify, 0);
  };

  return useMutation(handleClaimAndStake, {
    onSuccess: () => isAirdropClaimedQuery.refetch(),
  });
}
