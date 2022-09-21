import { useDiscord } from "hooks/useDiscord";
import { useOnboard } from "hooks/useOnboard";
import { useState } from "react";

export type FlowSelector = "splash" | "traveller" | "eligibility";

export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const { isConnected, connect } = useOnboard();

  const { redirectToAuth } = useDiscord();

  return {
    activePageFlow,
    setActivePageFlow,

    redirectToAuth,

    // Fns related to setting page flow
    switchToSplash: () => setActivePageFlow("splash"),
    switchToTraveller: () => setActivePageFlow("traveller"),
    switchToEligibility: () => setActivePageFlow("eligibility"),

    // Vars related to Onboard connection
    isConnected,
    connectWallet: () => connect(),
  };
}
