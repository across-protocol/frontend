import { ethers, providers } from "ethers";
import { hubPoolChainId, ChainId, infuraId } from "./constants";

function getProviderUrl(chainId: number) {
  const overrideUrl = process.env[`REACT_APP_CHAIN_${chainId}_PROVIDER_URL`];
  if (overrideUrl) {
    return overrideUrl;
  }

  const infuraUrl = new providers.InfuraProvider(chainId, infuraId).connection
    .url;
  return infuraUrl;
}

export const providerUrls: [ChainId, string][] = [
  [ChainId.MAINNET, getProviderUrl(ChainId.MAINNET)],
  [ChainId.ARBITRUM, getProviderUrl(ChainId.ARBITRUM)],
  [ChainId.POLYGON, getProviderUrl(ChainId.POLYGON)],
  [ChainId.OPTIMISM, getProviderUrl(ChainId.OPTIMISM)],
  [ChainId.ARBITRUM_GOERLI, getProviderUrl(ChainId.ARBITRUM_GOERLI)],
  [ChainId.GOERLI, getProviderUrl(ChainId.GOERLI)],
  [ChainId.MUMBAI, getProviderUrl(ChainId.MUMBAI)],
];

export const providerUrlsTable: Record<number, string> =
  Object.fromEntries(providerUrls);

export const providersTable: Record<
  number,
  ethers.providers.StaticJsonRpcProvider
> = Object.fromEntries(
  providerUrls.map(([chainId, url]) => {
    return [chainId, new ethers.providers.StaticJsonRpcProvider(url, chainId)];
  })
);

export function getProvider(
  chainId: ChainId = hubPoolChainId
): ethers.providers.StaticJsonRpcProvider {
  return providersTable[chainId];
}
