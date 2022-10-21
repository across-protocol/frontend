import { useState, useEffect } from "react";

import { getConfig } from "utils/config";
import { notificationEmitter } from "utils/notify";
import { airdropWindowIndex, hubPoolChainId } from "utils/constants";
import { useConnection } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";

const config = getConfig();

export function useMerkleDistributor() {
  const { account, signer, notify, chainId } = useConnection();
  const airdropRecipientQuery = useAirdropRecipient();

  const [isLoadingClaimed, setIsLoadingClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>();

  useEffect(() => {
    setErrorMsg(
      Number(chainId) !== hubPoolChainId
        ? `Wrong network. Please switch to network with id: ${hubPoolChainId}`
        : undefined
    );
  }, [chainId]);

  useEffect(() => {
    if (airdropRecipientQuery.data) {
      setIsLoadingClaimed(true);

      const merkleDistributor = config.getMerkleDistributor();
      merkleDistributor
        .isClaimed(airdropWindowIndex, airdropRecipientQuery.data.accountIndex)
        .then(setIsClaimed)
        .catch(console.error)
        .finally(() => setIsLoadingClaimed(false));
    }
  }, [airdropRecipientQuery.data, signer]);

  const handleClaim = async () => {
    try {
      if (!signer || !account) {
        setErrorMsg("No wallet connected");
        return;
      }

      if (!airdropRecipientQuery.data) {
        setErrorMsg("Ineligible for airdrop");
        return;
      }

      setIsClaiming(true);

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
        setErrorMsg("Invalid claim");
        return;
      }

      const tx = await merkleDistributor.claim(claimArgs);
      await notificationEmitter(tx.hash, notify);
      setIsClaimed(true);
    } catch (error) {
      console.error(error);
      setErrorMsg("Something went wrong. Please try again");
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    handleClaim,
    isClaimed,
    isClaiming,
    isLoadingClaimed,
    errorMsg,
  };
}
