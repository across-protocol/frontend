import { useEffect, useState } from "react";
import { useConnection } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";
import { useMerkleDistributor } from "./useMerkleDistributor";

import { getConfig } from "utils/config";
import ACXImageSrc from "assets/acx.svg";

export type FlowSelector = "splash" | "info" | "eligible" | "ineligible";

export default function useAirdrop() {
  const config = getConfig();
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const { isConnected, account, connect, provider } = useConnection();

  const airdropRecipientQuery = useAirdropRecipient();
  const merkleDistributor = useMerkleDistributor();

  const handleAddTokenToWallet = async () => {
    if (provider) {
      await (provider as any).send("wallet_watchAsset", {
        type: "ERC20",
        options: {
          address: config.getAcrossTokenAddress(),
          symbol: "ACX",
          decimals: 18,
          image: ACXImageSrc, // TODO
        },
      });
    }
  };

  useEffect(() => {
    if (isConnected && account && !airdropRecipientQuery.isLoading) {
      setActivePageFlow(airdropRecipientQuery.data ? "eligible" : "ineligible");
    } else {
      setActivePageFlow("splash");
    }
  }, [
    airdropRecipientQuery.data,
    airdropRecipientQuery.isLoading,
    isConnected,
    account,
  ]);

  return {
    activePageFlow,
    switchToInfo: () => setActivePageFlow("info"),
    switchToSplash: () => setActivePageFlow("splash"),
    switchToEligible: () => setActivePageFlow("eligible"),
    switchToIneligible: () => setActivePageFlow("ineligible"),

    airdropRecipientQuery,
    merkleDistributor,

    isConnected,
    account,
    connectWallet: () => connect(),
    handleAddTokenToWallet,
  };
}
