import { useState } from "react";

export default function usePreLaunchAirdrop() {
  // TODO: Determine when to show this flow.
  const [showTravellerFlow, setShowTravellerFlow] = useState(false);

  return {
    showTravellerFlow,
    setShowTravellerFlow,
  };
}
