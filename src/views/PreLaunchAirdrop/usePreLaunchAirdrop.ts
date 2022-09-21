import { useState } from "react";
import getPrelaunchRewards from "./api/getPrelaunchRewards";
export type FlowSelector = "splash" | "traveller" | "eligibility";
export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");

  return {
    activePageFlow,
    setActivePageFlow,

    switchToSplash: () => setActivePageFlow("splash"),
    switchToTraveller: () => setActivePageFlow("traveller"),
    switchToEligibility: () => setActivePageFlow("eligibility"),
  };
}
