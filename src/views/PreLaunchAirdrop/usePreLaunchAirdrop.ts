import { useState } from "react";

export default function usePreLaunchAirdrop() {
  const [showTravellerFlow, setShowTravellerFlow] = useState(false);

  return {
    showTravellerFlow,
    setShowTravellerFlow,
  };
}
