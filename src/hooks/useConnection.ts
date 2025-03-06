import { useCallback } from "react";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";

import { useIsContractAddress } from "./useIsContractAddress";
import { useSidebarContext } from "./useSidebarContext";
import { useEnsQuery } from "./useEns";
import { useEthersProvider, useEthersSigner } from "./useConnectionEVM";

import {
  trackConnectWalletButtonClicked,
  trackDisconnectWalletButtonClicked,
} from "utils";
import {
  ampli,
  ConnectWalletButtonClickedProperties,
  DisconnectWalletButtonClickedProperties,
} from "ampli";

export function useConnection() {
  const { openSidebar } = useSidebarContext();

  const { isConnected, address, chainId = 0, connector } = useAccount();
  const { disconnect: _disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const provider = useEthersProvider({ chainId });
  const signer = useEthersSigner({ chainId });

  const { data: ensName } = useEnsQuery(address);

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
    (
      options?: Parameters<typeof _disconnect>[0] & {
        trackSection?: DisconnectWalletButtonClickedProperties["section"];
      }
    ) => {
      if (options?.trackSection) {
        trackDisconnectWalletButtonClicked(options.trackSection);
      }
      _disconnect({ connector, ...options });
      ampli.client?.setUserId(undefined);
    },
    [connector, _disconnect]
  );

  const setChain = useCallback(
    async (chainId: number) => {
      const didSwitchChain = await switchChainAsync({ chainId });
      return didSwitchChain;
    },
    [switchChainAsync]
  );

  const isContractAddress = useIsContractAddress(address, chainId);

  return {
    account: address,
    ensName,
    chainId,
    provider,
    signer,
    isConnected,
    connect,
    disconnect,
    connector,
    setChain,
    isContractAddress,
  };
}
