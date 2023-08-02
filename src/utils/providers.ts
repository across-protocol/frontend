import { ethers, providers } from "ethers";
import { hubPoolChainId, ChainId, infuraId } from "./constants";

function getInfuraProviderUrl(chainId: number) {
  const infuraUrl = new providers.InfuraProvider(chainId, infuraId).connection
    .url;
  return infuraUrl;
}

export const providerUrls: [ChainId, string][] = [
  [
    ChainId.MAINNET,
    process.env.REACT_APP_CHAIN_1_PROVIDER_URL ||
      getInfuraProviderUrl(ChainId.MAINNET),
  ],
  [
    ChainId.ARBITRUM,
    process.env.REACT_APP_CHAIN_42161_PROVIDER_URL ||
      getInfuraProviderUrl(ChainId.ARBITRUM),
  ],
  [
    ChainId.POLYGON,
    process.env.REACT_APP_CHAIN_137_PROVIDER_URL ||
      getInfuraProviderUrl(ChainId.POLYGON),
  ],
  [
    ChainId.OPTIMISM,
    process.env.REACT_APP_CHAIN_10_PROVIDER_URL ||
      getInfuraProviderUrl(ChainId.OPTIMISM),
  ],
  [
    ChainId.ARBITRUM_GOERLI,
    process.env.REACT_APP_CHAIN_421613_PROVIDER_URL ||
      getInfuraProviderUrl(ChainId.ARBITRUM_GOERLI),
  ],
  [
    ChainId.GOERLI,
    process.env.REACT_APP_CHAIN_5_PROVIDER_URL ||
      getInfuraProviderUrl(ChainId.GOERLI),
  ],
  [
    ChainId.MUMBAI,
    process.env.REACT_APP_CHAIN_80001_PROVIDER_URL ||
      getInfuraProviderUrl(ChainId.MUMBAI),
  ],
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
