import { useContext } from "react";
import { useState, useCallback, createContext } from "react";
import { onboardInit } from "utils/onboardV2";
import { OnboardAPI } from "@web3-onboard/core";
import {
  useConnectWallet,
  useSetChain,
  // useWallets
} from "@web3-onboard/react";

type OnboardContextValue = {
  onboard: OnboardAPI;
};

function useOnboardManager() {
  const [onboard] = useState<OnboardAPI>(onboardInit());

  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  // const connectedWallets = useWallets()

  return {
    onboard,
    connect,
    disconnect,
    chains,
    connectedChain,
    settingChain,
    setChain,
    wallet,
    isConnected: !!connectedChain,
  };
}

const OnboardContext = createContext<OnboardContextValue | undefined>(
  undefined
);
OnboardContext.displayName = "OnboardContext";
export const OnboardProvider: React.FC = ({ children }) => {
  const value = useOnboardManager();
  return (
    <OnboardContext.Provider value={value}>{children}</OnboardContext.Provider>
  );
};

export function useOnboard() {
  const context = useContext(OnboardContext);
  if (!context) {
    throw new Error("useOnboard must be used within an <OnboardProvider>");
  }
  return context;
}
