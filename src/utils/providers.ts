import { ethers } from "ethers";
import { ChainId } from "./utils.d";
import { hubPoolChainId } from "./constants";
const infuraId = import.meta.env.VITE_PUBLIC_INFURA_ID || "";
const ArbitrumProviderUrl =
  import.meta.env.VITE_CHAIN_42161_PROVIDER_URL ||
  `https://arbitrum-mainnet.infura.io/v3/${infuraId}`;

const PolygonProviderUrl =
  import.meta.env.VITE_CHAIN_137_PROVIDER_URL ||
  `https://polygon-mainnet.infura.io/v3/${infuraId}`;

export const providerUrls: [ChainId, string][] = [
  [ChainId.MAINNET, `https://mainnet.infura.io/v3/${infuraId}`],
  [ChainId.ARBITRUM, ArbitrumProviderUrl],
  [ChainId.POLYGON, PolygonProviderUrl],
  [ChainId.OPTIMISM, `https://optimism-mainnet.infura.io/v3/${infuraId}`],
  [ChainId.ARBITRUM_GOERLI, `https://arbitrum-goerli.infura.io/v3/${infuraId}`],
  [ChainId.GOERLI, `https://goerli.infura.io/v3/${infuraId}`],
  [ChainId.MUMBAI, `https://polygon-mumbai.infura.io/v3/${infuraId}`],
];

export const providerUrlsTable: Record<number, string> =
  Object.fromEntries(providerUrls);

export const providers: [number, ethers.providers.StaticJsonRpcProvider][] =
  providerUrls.map(([chainId, url]) => {
    return [chainId, new ethers.providers.StaticJsonRpcProvider(url, chainId)];
  });
export const providersTable: Record<
  number,
  ethers.providers.StaticJsonRpcProvider
> = Object.fromEntries(providers);

export function getProvider(
  chainId: ChainId = hubPoolChainId
): ethers.providers.StaticJsonRpcProvider {
  return providersTable[chainId];
}
