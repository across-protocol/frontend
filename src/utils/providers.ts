import { ethers } from "ethers";
import {
  hubPoolChainId,
  ChainId,
  getChainInfo,
  vercelApiBaseUrl,
} from "./constants";
import { createSolanaRpc, MainnetUrl } from "@solana/kit";
import { SVMProvider } from "@across-protocol/sdk/dist/esm/arch/svm";
import { CHAIN_IDs } from "@across-protocol/constants";

export function getProviderUrl(chainId: number): string {
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

export function getSVMRpc(
  chainId: number,
  config?: Parameters<typeof createSolanaRpc>[1]
): SVMProvider {
  const transport = getProviderUrl(chainId) as MainnetUrl;
  return createSolanaRpc(transport, config) as SVMProvider;
}

const resolveRpcConfig = () => {
  const defaultRange = 10_000;
  const ranges = {
    [CHAIN_IDs.ALEPH_ZERO]: 0,
    [CHAIN_IDs.BOBA]: 0,
    [CHAIN_IDs.HYPEREVM]: 1_000, // QuickNode constraint.
    [CHAIN_IDs.MONAD]: 50, // public RPC constraint
    [CHAIN_IDs.SOLANA]: 1_000,
    [CHAIN_IDs.SOLANA_DEVNET]: 1000,
  };
  return Object.fromEntries(
    Object.values(CHAIN_IDs).map((chainId) => [
      chainId,
      ranges[chainId] ?? defaultRange,
    ])
  );
};

export const CHAIN_MAX_BLOCK_LOOKBACK = resolveRpcConfig();
