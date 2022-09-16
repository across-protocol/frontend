import { useState } from "react";

export type FlowSelector = "splash" | "traveller" | "eligibility";

export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");

  return {
    activePageFlow,
    setActivePageFlow,
  };
}
