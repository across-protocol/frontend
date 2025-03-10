import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useSidebarContext } from "./useSidebarContext";
import {
  trackConnectWalletButtonClicked,
  trackDisconnectWalletButtonClicked,
} from "utils";
import {
  ConnectWalletButtonClickedProperties,
  DisconnectWalletButtonClickedProperties,
} from "ampli";

type WalletState =
  | "connecting"
  | "connected"
  | "disconnecting"
  | "has-wallet"
  | "no-wallet";

export function useConnectionSVM() {
  const { openSidebar } = useSidebarContext();

  const {
    connected,
    connecting,
    disconnect: _disconnect,
    disconnecting,
    publicKey,
    select,
    wallet,
  } = useWallet();

  let state: WalletState;
  if (connecting) {
    state = "connecting";
  } else if (connected) {
    state = "connected";
  } else if (disconnecting) {
    state = "disconnecting";
  } else if (wallet) {
    state = "has-wallet";
  } else {
    state = "no-wallet";
  }

  const connect = useCallback(
    (options?: {
      trackSection?: ConnectWalletButtonClickedProperties["section"];
    }) => {
      openSidebar("connect-wallet");

      if (options?.trackSection) {
        trackConnectWalletButtonClicked(options.trackSection);
      }
    },
    [openSidebar]
  );

  const disconnect = useCallback(
    (options?: {
      trackSection?: DisconnectWalletButtonClickedProperties["section"];
    }) => {
      if (options?.trackSection) {
        trackDisconnectWalletButtonClicked(options.trackSection);
      }
      _disconnect();
    },
    [_disconnect]
  );

  return {
    account: publicKey,
    select,
    state,
    connect,
    disconnect,
    isConnected: connected,
  };
}
