import { useState } from "react";

export default function usePreLaunchAirdrop() {
  const [showTravellerFlow, setShowTravellerFlow] = useState(true);

  return {
    showTravellerFlow,
    setShowTravellerFlow,
  };
}
