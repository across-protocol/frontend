import { useContext, useEffect } from "react";
import { useState, createContext } from "react";
import {
  trackEvent,
  ChainId,
  UnsupportedChainIdError,
  isSupportedChainId,
} from "utils";
import { onboardInit } from "utils/onboard";
import {
  OnboardAPI,
  ConnectOptions,
  WalletState,
  DisconnectOptions,
  ConnectedChain,
} from "@web3-onboard/core";

import { Account } from "@web3-onboard/core/dist/types";

import { useConnectWallet, useSetChain } from "@web3-onboard/react";
import { Chain } from "@web3-onboard/common";
import { ethers } from "ethers";
import Notify, { API as NotifyAPI, ConfigOptions } from "bnc-notify";

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
  signer: ethers.providers.JsonRpcSigner | undefined;
  provider: ethers.providers.Web3Provider | null;
  notify: NotifyAPI;
  setNotifyConfig: (opts: ConfigOptions) => void;
  account: Account | null;
  chainId: ChainId;
  error?: Error;
};

const notify = Notify({
  dappId: process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY,
  networkId: 1,
  desktopPosition: "topRight",
});

function useOnboardManager() {
  const [onboard, setOnboard] = useState<OnboardAPI | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<
    ethers.providers.JsonRpcSigner | undefined
  >(undefined);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<Error | undefined>(undefined);
  useEffect(() => {
    if (!onboard) setOnboard(onboardInit());
  }, [onboard]);

  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();

  useEffect(() => {
    if (wallet?.accounts) {
      setAccount(wallet.accounts[0]);
    } else {
      setAccount(null);
    }

    if (wallet?.provider) {
      setProvider(new ethers.providers.Web3Provider(wallet.provider, "any"));
      setSigner(new ethers.providers.Web3Provider(wallet.provider).getSigner());
    } else {
      setProvider(null);
      setSigner(undefined);
    }

    if (wallet?.chains) {
      const chainId = Number(wallet.chains[0].id);
      if (!isSupportedChainId(chainId)) {
        setError(new UnsupportedChainIdError(chainId));
      } else {
        setError(undefined);
      }
    } else {
      setError(undefined);
    }
  }, [wallet]);

  return {
    onboard,
    connect: (options?: ConnectOptions | undefined) => {
      trackEvent({ category: "wallet", action: "connect", name: "null" });
      return connect(options);
    },
    disconnect: (wallet: DisconnectOptions) => {
      trackEvent({ category: "wallet", action: "disconnect", name: "null" });
      return disconnect(wallet);
    },
    chains,
    connectedChain,
    settingChain,
    setChain,
    wallet,
    isConnected: !!connectedChain,
    signer,
    provider,
    notify,
    setNotifyConfig: (config: ConfigOptions) => notify.config(config),
    account,
    chainId: (Number(wallet?.chains[0].id) as ChainId) || 0,
    error,
  };
}

export const OnboardContext = createContext<OnboardContextValue | undefined>(
  undefined
);
OnboardContext.displayName = "OnboardContext";
export const OnboardProvider: React.FC = ({ children }) => {
  const value = useOnboardManager();
  return (
    <OnboardContext.Provider value={value}>{children}</OnboardContext.Provider>
  );
};

OnboardProvider.displayName = "OnboardProvider";

export function useOnboard() {
  const context = useContext(OnboardContext);
  if (!context) {
    throw new Error("useOnboard must be used within an <OnboardProvider>");
  }
  return context;
}
