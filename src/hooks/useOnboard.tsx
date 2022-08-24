import { useContext, useEffect } from "react";
import { useState, useCallback, createContext } from "react";
import { onboardInit } from "utils/onboardV2";
import { OnboardAPI } from "@web3-onboard/core";
import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";
import {
  ConnectOptions,
  WalletState,
  DisconnectOptions,
  ConnectedChain,
} from "@web3-onboard/core";
import { Chain } from "@web3-onboard/common";
import { ethers } from "ethers";
export type SetChainOptions = {
  chainId: string;
  chainNamespace?: string;
};

type OnboardContextValue = {
  onboard: OnboardAPI | null;
  connect: (options?: ConnectOptions | undefined) => Promise<WalletState[]>;
  disconnect: (wallet: DisconnectOptions) => Promise<WalletState[]>;
  chains: Chain[];
  connectedChain: ConnectedChain | null;
  settingChain: boolean;
  setChain: (options: SetChainOptions) => Promise<boolean>;
  wallet: WalletState | null;
  isConnected: boolean;
  // signer: ethers.providers.JsonRpcSigner | undefined;
};

function useOnboardManager() {
  const [onboard, setOnboard] = useState<OnboardAPI | null>(null);
  useEffect(() => {
    if (!onboard) setOnboard(onboardInit());
  }, [onboard]);

  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  // const connectedWallets = useWallets()
  // let signer: ethers.providers.JsonRpcSigner | undefined;
  // if (wallet) {
  //   const provider = new ethers.providers.Web3Provider(wallet.provider);
  //   signer = provider.getSigner();
  // }

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
    // signer,
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
