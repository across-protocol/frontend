import { useMutation } from "react-query";
import { ERC20__factory } from "@across-protocol/contracts-v2";

import { getConfig } from "utils/config";
import { notificationEmitter } from "utils/notify";
import { useConnection, useIsWrongNetwork } from "hooks";
import { AirdropRecipient } from "utils/merkle-distributor";
import { MAX_APPROVAL_AMOUNT } from "utils";

const config = getConfig();

export function useClaimAndStake(
  claims: AirdropRecipient[],
  onSuccess: () => void
) {
  const { account, signer, notify } = useConnection();
  const { isWrongNetwork, isWrongNetworkHandler } = useIsWrongNetwork();

  const handleClaimAndStake = async () => {
    if (!claims.length) {
      return;
    }

    if (!signer || !account) {
      throw new Error("No wallet connected");
    }

    if (isWrongNetwork) {
      await isWrongNetworkHandler();
    }

    const merkleDistributor = config.getMerkleDistributor(signer);
    const acceleratingDistributor = config.getAcceleratingDistributor();
    const rewardToken = ERC20__factory.connect(
      await acceleratingDistributor.rewardToken(),
      signer
    );

    const approvalRequired = (
      await rewardToken.allowance(account, acceleratingDistributor.address)
    ).lt(MAX_APPROVAL_AMOUNT);

    if (approvalRequired) {
      const approveTx = await rewardToken.approve(
        acceleratingDistributor.address,
        MAX_APPROVAL_AMOUNT
      );
      await notificationEmitter(approveTx.hash, notify);
    }

    const claimAndStakeTx = await merkleDistributor.claimMulti(
      claims.map((claim) => ({
        ...claim,
        merkleProof: claim.proof,
        account,
      }))
    ); // TODO: replace with `claimAndStake`
    await notificationEmitter(claimAndStakeTx.hash, notify);
  };

  return useMutation(handleClaimAndStake, {
    onSuccess,
  });
}
