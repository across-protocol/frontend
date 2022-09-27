import { useDiscord } from "hooks/useDiscord";
import { useState, useEffect } from "react";
import { useConnection } from "hooks";
import { useGetPrelaunchRewards } from "../api/useGetPrelaunchRewards";
import { useDiscordDetails } from "./useDiscordDetails";

export type FlowSelector = "splash" | "traveller" | "info";

export default function usePreLaunchAirdrop() {
  const [activePageFlow, setActivePageFlow] = useState<FlowSelector>("splash");
  const { redirectToAuth, unauthenticate, isAuthenticated } = useDiscord();
  const { isConnected, account, connect } = useConnection();

  const { rewardsData } = useGetPrelaunchRewards(account);
  const {
    discordAvatar,
    discordId,
    discordName,
    linkWalletHandler,
    linkedWallet,
  } = useDiscordDetails();

  useEffect(() => {
    if (Object.keys(rewardsData).length && account && isConnected) {
      setActivePageFlow("splash");
    }
  }, [rewardsData, account, isConnected]);

  return {
    activePageFlow,
    setActivePageFlow,

    discordLoginHandler: redirectToAuth,
    discordLogoutHandler: unauthenticate,
    isDiscordAuthenticated: isAuthenticated,

    // Fns related to setting page flow
    switchToSplash: () => setActivePageFlow("splash"),
    switchToTraveller: () => setActivePageFlow("traveller"),
    switchToInfo: () => setActivePageFlow("info"),

    // Vars related to Onboard connection
    isConnected,
    account,
    connectWalletHandler: () => connect(),

    // Vars related to state management & modification
    linkWalletHandler,
    rewardsData,

    discordAvatar,
    discordId,
    discordName,
    linkedWallet,
  };
}
