import { ethers } from "ethers";
import {
  hubPoolChainId,
  ChainId,
  getChainInfo,
  vercelApiBaseUrl,
} from "./constants";
import { Connection, ConnectionConfig } from "@solana/web3.js";
import { createSolanaRpc, MainnetUrl } from "@solana/kit";
import { SVMProvider } from "@across-protocol/sdk/dist/esm/arch/svm";

function getProviderUrl(chainId: number): string {
  const resolvedRpcUrl =
    getChainInfo(chainId)?.customRpcUrl || getChainInfo(chainId)?.rpcUrl;
  if (resolvedRpcUrl) {
    return resolvedRpcUrl;
  } else {
    throw new Error(`No provider URL found for chainId ${chainId}`);
  }
}

export function getProxyRpcUrl(chainId: number): string {
  return `${vercelApiBaseUrl}/api/rpc-proxy?chainId=${chainId}`;
}

export const providersTable: Record<
  number,
  ethers.providers.StaticJsonRpcProvider
> = Object.values(ChainId)
  .filter((c) => !Number.isNaN(Number(c)))
  .reduce(
    (acc, v) => ({
      ...acc,
      [Number(v)]: new ethers.providers.StaticJsonRpcProvider(
        getProviderUrl(Number(v)),
        Number(v)
      ),
    }),
    {}
  );

export const providerUrlsTable: Record<number, string> = Object.fromEntries(
  Object.entries(providersTable).map(([k, v]) => [k, v.connection.url])
);

export function getProvider(
  chainId: ChainId = hubPoolChainId
): ethers.providers.StaticJsonRpcProvider {
  return providersTable[chainId];
}

// In-memory provider cache
const solanaProviders: Record<number, Connection> = {};

export function getSVMProvider(chainId: number): Connection {
  // Return cached provider if it exists
  if (solanaProviders[chainId]) {
    return solanaProviders[chainId];
  }

  const url = getProviderUrl(chainId);

  if (!url) {
    throw new Error(`No Solana RPC URL configured for chain ID ${chainId}`);
  }

  // TODO
  const connectionConfig: ConnectionConfig = {
    commitment: "confirmed",
    disableRetryOnRateLimit: false,
  };

  const connection = new Connection(url, connectionConfig);

  // Cache it
  solanaProviders[chainId] = connection;

  return connection;
}

export function getSVMRpc(
  chainId: number,
  config?: Parameters<typeof createSolanaRpc>[1]
): SVMProvider {
  const transport = getProviderUrl(chainId) as MainnetUrl;
  return createSolanaRpc(transport, config) as SVMProvider;
}
