import { useCallback, useContext, useEffect } from "react";
import { useState, createContext } from "react";
import {
  ChainId,
  UnsupportedChainIdError,
  isSupportedChainId,
  insideStorybookRuntime,
  hubPoolChainId,
  trackIfWalletSelected,
  trackWalletConnectTransactionCompleted,
  trackConnectWalletButtonClicked,
  trackDisconnectWalletButtonClicked,
  identifyUserWallets,
  trackWalletChainId,
  trackIsFirstTimeUser,
} from "utils";
import { onboardInit } from "utils/onboard";
import {
  OnboardAPI,
  ConnectOptions,
  WalletState,
  ConnectedChain,
} from "@web3-onboard/core";

import { Account } from "@web3-onboard/core/dist/types";

import { useConnectWallet, useSetChain } from "@web3-onboard/react";
import { Chain } from "@web3-onboard/common";
import { ethers } from "ethers";
import Notify, { API as NotifyAPI, ConfigOptions } from "bnc-notify";
import {
  ampli,
  ConnectWalletButtonClickedProperties,
  DisconnectWalletButtonClickedProperties,
} from "ampli";
import { useUserDeposits } from "hooks/useDeposits";

export type SetChainOptions = {
  chainId: string;
  chainNamespace?: string;
};

const CACHED_WALLET_KEY = "previous-wallet-service";

type TrackOnConnectOptions = {
  trackSection?: ConnectWalletButtonClickedProperties["section"];
};

type TrackOnDisconnectOptions = {
  trackSection?: DisconnectWalletButtonClickedProperties["section"];
};

type OnboardContextValue = {
  onboard: OnboardAPI | null;
  connect: (
    options?: ConnectOptions & TrackOnConnectOptions
  ) => Promise<WalletState[]>;
  disconnect: (
    wallet: WalletState,
    options?: TrackOnDisconnectOptions
  ) => Promise<WalletState[]>;
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
  networkId: hubPoolChainId,
  desktopPosition: "topRight",
});

export function useOnboardManager() {
  const [onboard, setOnboard] = useState<OnboardAPI | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<
    ethers.providers.JsonRpcSigner | undefined
  >(undefined);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<Error | undefined>(undefined);

  /** Immediately resolve the onboard when it becomes available */
  if (!onboard) setOnboard(onboardInit());

  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();

  // We use this query to check whether the user has any deposits, i.e. is a first time user
  const userDepositsQuery = useUserDeposits("filled", 1, 0, account?.address);

  useEffect(() => {
    if (userDepositsQuery.data && account) {
      trackIsFirstTimeUser(userDepositsQuery.data.deposits.length === 0);
    }
  }, [userDepositsQuery.data, account]);

  useEffect(() => {
    if (wallet?.accounts) {
      setAccount(wallet.accounts[0]);
    } else {
      setAccount(null);
    }

    if (wallet?.provider) {
      setProvider(new ethers.providers.Web3Provider(wallet.provider, "any"));
      setSigner(
        new ethers.providers.Web3Provider(wallet.provider, "any").getSigner()
      );
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

  useEffect(() => {
    if (connectedChain && wallet) {
      const chainId = String(parseInt(connectedChain.id, 16));
      trackWalletChainId(chainId);
      ampli.walletNetworkSelected({
        chainId,
        chainName: connectedChain?.namespace || "unknown",
      });
    }
  }, [connectedChain, wallet]);

  useEffect(() => {
    // Only acknowledge the state where onboard is defined
    // Also disable for when running inside of storybook
    if (onboard && !insideStorybookRuntime) {
      // Retrieve the list of onboard's wallet connections
      const walletState = onboard?.state.select("wallets");
      // Subscribe to the state for any changes
      const { unsubscribe } = walletState.subscribe((wallets) => {
        // Iterate over all wallets and extract their label
        const connectedWallets = wallets.map(({ label }) => label);
        // If a wallet label is present, update the browser state
        // so that this information is preserved on refresh
        if (connectedWallets.length > 0) {
          window.localStorage.setItem(CACHED_WALLET_KEY, connectedWallets[0]);
        }
      });
      // Unsubscribe to the observer when this component is
      // unmounted
      return () => {
        unsubscribe();
      };
    }
  }, [onboard]);

  const customOnboardDisconnect = useCallback(
    (wallet: WalletState, options?: TrackOnDisconnectOptions) => {
      if (options?.trackSection) {
        trackDisconnectWalletButtonClicked(options.trackSection);
      }
      ampli.client?.setUserId(undefined);
      // User requested to be disconnected, let's clear out the wallet type
      // for the event that they're trying to connect using a different wallet
      window.localStorage.removeItem(CACHED_WALLET_KEY);
      return disconnect(wallet);
    },
    [disconnect]
  );

  const customOnboardConnect = useCallback(
    async (options?: ConnectOptions & TrackOnConnectOptions) => {
      // Resolve the last wallet type if this user has connected before
      const previousConnection = window.localStorage.getItem(CACHED_WALLET_KEY);
      // Test the user was connected before a browser refresh and that
      // the calling code did not specify an autoSelect parameter
      if (previousConnection && !options?.autoSelect) {
        // Append the autoSelect option to include the previous connection
        // type
        options = {
          ...options,
          autoSelect: {
            label: previousConnection,
            disableModals: true,
          },
        };
      }
      const walletStates = await connect(
        options?.autoSelect ? options : undefined
      );

      identifyUserWallets(walletStates);
      if (options?.trackSection) {
        trackConnectWalletButtonClicked(options.trackSection);
      }
      trackIfWalletSelected(walletStates, previousConnection);
      trackWalletConnectTransactionCompleted(walletStates, previousConnection);

      return walletStates;
    },
    [connect]
  );

  useEffect(() => {
    // Check if a key exists from the previous wallet
    const previousConnection = window.localStorage.getItem(CACHED_WALLET_KEY);
    if (!wallet && previousConnection) {
      customOnboardConnect();
    }
  }, [customOnboardConnect, wallet]);

  return {
    onboard,
    connect: customOnboardConnect,
    disconnect: customOnboardDisconnect,
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
