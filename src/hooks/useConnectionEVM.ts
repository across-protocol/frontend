import { providers } from "ethers";
import { useMemo, useCallback } from "react";
import {
  Config,
  useClient,
  useConnectorClient,
  useAccount,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import type { Account, Chain, Client, Transport } from "viem";

import { useSidebarContext } from "./useSidebarContext";
import { useEnsQuery } from "./useEns";
import {
  trackConnectWalletButtonClicked,
  trackDisconnectWalletButtonClicked,
} from "utils";
import {
  ampli,
  ConnectWalletButtonClickedProperties,
  DisconnectWalletButtonClickedProperties,
} from "ampli";
import { useDisallowList } from "hooks/useDisallowList";
import { useAddressType } from "./useAddressType";

export function useConnectionEVM() {
  const { openSidebar } = useSidebarContext();

  const { isConnected, address, chainId = 0, connector } = useAccount();
  const { disconnect: _disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const provider = useEthersProvider({ chainId });
  const signer = useEthersSigner({ chainId });
  const { isBlocked } = useDisallowList(address);

  const { data: ensName } = useEnsQuery(address);
  const addressType = useAddressType(address, chainId);

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
    isContractAddress: addressType === "contract",
    isBlocked,
  };
}

/** Hook to convert a viem Client to an ethers.js Provider. */
export function useEthersProvider({
  chainId,
}: { chainId?: number | undefined } = {}) {
  const client = useClient<Config>({ chainId });
  return useMemo(
    () => (client ? clientToProvider(client) : undefined),
    [client]
  );
}

/** Hook to convert a Viem Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}

export function clientToProvider(client: Client<Transport, Chain>) {
  const { transport } = client;

  if (transport.type === "fallback")
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<Transport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, "any")
      )
    );
  return new providers.JsonRpcProvider(transport.url, "any");
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, transport } = client;
  const provider = new providers.Web3Provider(transport, "any");
  const signer = provider.getSigner(account.address);
  return signer;
}
