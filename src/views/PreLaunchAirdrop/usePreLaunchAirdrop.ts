import { useOnboard } from "hooks/useOnboard";
import { useState } from "react";

export type FlowSelector = "splash" | "traveller" | "info";

export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");

  const { isConnected, connect, account } = useOnboard();

  return {
    activePageFlow,
    setActivePageFlow,

    switchToSplash: () => setActivePageFlow("splash"),
    switchToTraveller: () => setActivePageFlow("traveller"),
    switchToInfo: () => setActivePageFlow("info"),

    isConnected,
    connectWalletHandler: () => connect(),
    account,

    linkWalletHandler: async () => {},
  };
}
