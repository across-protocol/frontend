import { useMutation } from "react-query";
import { providers } from "ethers";

import { getConfig } from "utils/config";
import { notificationEmitter } from "utils/notify";
import { airdropWindowIndex, hubPoolChainId } from "utils/constants";
import { useConnection } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useIsClaimed } from "./useIsClaimed";

const config = getConfig();

export function useClaim() {
  const { account, signer, notify, setChain, chainId } = useConnection();
  const airdropRecipientQuery = useAirdropRecipient();
  const isClaimedQuery = useIsClaimed();

  const handleClaim = async () => {
    if (!signer || !account) {
      throw new Error("No wallet connected");
    }

    if (!airdropRecipientQuery.data) {
      throw new Error("Ineligible for airdrop");
    }

    if (Number(chainId) !== hubPoolChainId) {
      const didSetChain = await setChain({
        chainId: `0x${hubPoolChainId.toString(16)}`,
      });

      if (!didSetChain) {
        throw new Error(
          `Wrong network. Please switch to network ${
            providers.getNetwork(hubPoolChainId).name
          }`
        );
      }
    }

    const merkleDistributor = config.getMerkleDistributor(signer);

    const claimArgs = {
      windowIndex: airdropWindowIndex,
      account,
      accountIndex: airdropRecipientQuery.data.accountIndex,
      amount: airdropRecipientQuery.data.amount,
      merkleProof: airdropRecipientQuery.data.proof,
    };

    const isValidClaim = await merkleDistributor.verifyClaim(claimArgs);

    if (!isValidClaim) {
      throw new Error("Invalid claim");
    }

    const tx = await merkleDistributor.claim(claimArgs);
    await notificationEmitter(tx.hash, notify);
  };

  return useMutation(handleClaim, {
    onSuccess: () => isClaimedQuery.refetch(),
  });
}
