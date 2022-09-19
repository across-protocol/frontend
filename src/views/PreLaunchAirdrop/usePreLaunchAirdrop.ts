import { useState } from "react";

export type FlowSelector = "splash" | "traveller" | "eligibility" | "info";

export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");

  return {
    activePageFlow,
    setActivePageFlow,

    switchToSplash: () => setActivePageFlow("splash"),
    switchToTraveller: () => setActivePageFlow("traveller"),
    switchToEligibility: () => setActivePageFlow("eligibility"),
    switchToInfo: () => setActivePageFlow("info"),
  };
}
