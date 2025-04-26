import {
  useCallback,
  useContext,
  useEffect,
  useState,
  createContext,
} from "react";
import {
  ChainId,
  UnsupportedChainIdError,
  isSupportedChainId,
  insideStorybookRuntime,
  trackIfWalletSelected,
  trackConnectWalletButtonClicked,
  trackDisconnectWalletButtonClicked,
  CACHED_WALLET_KEY,
  identifyUserWallet,
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
import {
  ampli,
  ConnectWalletButtonClickedProperties,
  DisconnectWalletButtonClickedProperties,
} from "ampli";
import { useDisallowList } from "./useDisallowList";

export type SetChainOptions = {
  chainId: string;
  chainNamespace?: string;
};

type TrackOnConnectOptions = {
  trackSection?: ConnectWalletButtonClickedProperties["section"];
};

type AttemptAutoSelectOptions = {
  enableAutoSelect?: boolean;
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
  account: Account | null;
  chainId: ChainId;
  error?: Error;
  didAttemptAutoSelect: boolean;
};

export function useOnboardManager() {
  const [onboard, setOnboard] = useState<OnboardAPI | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<
    ethers.providers.JsonRpcSigner | undefined
  >(undefined);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [didAttemptAutoSelect, setDidAttemptAutoSelect] = useState(false);

  /** Immediately resolve the onboard when it becomes available */
  if (!onboard) setOnboard(onboardInit());

  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();

  const { isBlocked } = useDisallowList(account?.address);

  useEffect(() => {
    if (wallet && isBlocked) {
      disconnect(wallet);
    }
  }, [wallet, disconnect, isBlocked]);

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
  }, [wallet, disconnect]);

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
        try {
          unsubscribe();
        } catch (e) {
          console.error("Failed to unsubscribe from onboard wallet state", e);
        }
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
    async (
      options: ConnectOptions &
        TrackOnConnectOptions &
        AttemptAutoSelectOptions = {}
    ) => {
      let { trackSection, enableAutoSelect, ...connectOptions } = options;
      // Resolve the last wallet type if this user has connected before
      const previousConnection = window.localStorage.getItem(CACHED_WALLET_KEY);
      // Test the user was connected before a browser refresh and that
      // the calling code did not specify an autoSelect parameter
      if (
        previousConnection &&
        !connectOptions?.autoSelect &&
        !!enableAutoSelect
      ) {
        // Append the autoSelect option to include the previous connection
        // type
        connectOptions = {
          ...connectOptions,
          autoSelect: {
            label: previousConnection,
            disableModals: true,
          },
        };
      }
      const walletStates = await connect(
        connectOptions?.autoSelect ? connectOptions : undefined
      );
      if (walletStates[0]) {
        identifyUserWallet(walletStates[0]);
      }
      if (trackSection) {
        trackConnectWalletButtonClicked(trackSection);
      }
      trackIfWalletSelected(walletStates, previousConnection);

      return walletStates;
    },
    [connect]
  );

  useEffect(() => {
    // Check if a key exists from the previous wallet
    const previousConnection = window.localStorage.getItem(CACHED_WALLET_KEY);
    if (!wallet && previousConnection) {
      customOnboardConnect({
        enableAutoSelect: true,
      }).then(() => {
        setDidAttemptAutoSelect(true);
      });
    } else {
      setDidAttemptAutoSelect(true);
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
    account,
    chainId: (Number(wallet?.chains[0].id) as ChainId) || 0,
    error,
    didAttemptAutoSelect,
  };
}

export const OnboardContext = createContext<OnboardContextValue | undefined>(
  undefined
);
OnboardContext.displayName = "OnboardContext";
export const OnboardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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
