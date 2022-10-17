import { useEffect, useState } from "react";
import { useConnection } from "hooks";

import { useAirdropRecipient } from "./useAirdropRecipient";

export type FlowSelector = "splash" | "info" | "eligible" | "ineligible";

export default function useAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const { isConnected, account, connect } = useConnection();

  const airdropRecipientQuery = useAirdropRecipient();

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

    isConnected,
    account,
    connectWallet: () => connect(),
  };
}
