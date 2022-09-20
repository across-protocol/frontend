import { useDiscord } from "hooks/useDiscord";
import { useState } from "react";

export type FlowSelector = "splash" | "traveller" | "eligibility";

export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");

  const { redirectToAuth } = useDiscord();

  return {
    activePageFlow,
    setActivePageFlow,

    redirectToAuth,

    switchToSplash: () => setActivePageFlow("splash"),
    switchToTraveller: () => setActivePageFlow("traveller"),
    switchToEligibility: () => setActivePageFlow("eligibility"),
  };
}
