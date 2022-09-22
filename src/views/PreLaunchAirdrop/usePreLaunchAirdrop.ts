import { useState, useEffect } from "react";
import { useConnection } from "hooks";
import { useGetPrelaunchRewards } from "./api/useGetPrelaunchRewards";
export type FlowSelector = "splash" | "traveller" | "info";

export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const { isConnected, account } = useConnection();

  const { rewardsData } = useGetPrelaunchRewards(account);
  useEffect(() => {
    if (Object.keys(rewardsData).length && account && isConnected) {
      setActivePageFlow("splash");
    }
  }, [rewardsData, account, isConnected]);

  return {
    activePageFlow,
    setActivePageFlow,

    switchToSplash: () => setActivePageFlow("splash"),
    switchToTraveller: () => setActivePageFlow("traveller"),
    switchToInfo: () => setActivePageFlow("info"),
    rewardsData,
    account,
  };
}
