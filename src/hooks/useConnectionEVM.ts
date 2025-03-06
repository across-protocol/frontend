import { providers } from "ethers";
import { useMemo } from "react";
import { Config, useClient, useConnectorClient } from "wagmi";
import type { Account, Chain, Client, Transport } from "viem";

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
