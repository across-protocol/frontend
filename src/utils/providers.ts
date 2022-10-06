import { ethers } from "ethers";
import { ChainId } from "./utils.d";
import { hubPoolChainId } from "./constants";
const infuraId = process.env.REACT_APP_PUBLIC_INFURA_ID || "";
const ArbitrumProviderUrl =
  process.env.REACT_APP_CHAIN_42161_PROVIDER_URL ||
  `https://arbitrum-mainnet.infura.io/v3/${infuraId}`;

const PolygonProviderUrl =
  process.env.REACT_APP_CHAIN_137_PROVIDER_URL ||
  `https://polygon-mainnet.infura.io/v3/${infuraId}`;

export const providerUrls: [ChainId, string][] = [
  [ChainId.MAINNET, `https://mainnet.infura.io/v3/${infuraId}`],
  [ChainId.ARBITRUM, ArbitrumProviderUrl],
  [ChainId.POLYGON, PolygonProviderUrl],
  [ChainId.OPTIMISM, `https://optimism-mainnet.infura.io/v3/${infuraId}`],
  [ChainId.BOBA, `https://mainnet.boba.network`],
  [ChainId.RINKEBY, `https://rinkeby.infura.io/v3/${infuraId}`],
  [ChainId.KOVAN, `https://kovan.infura.io/v3/${infuraId}`],
  [ChainId.KOVAN_OPTIMISM, `https://optimism-kovan.infura.io/v3/${infuraId}`],
  [
    ChainId.ARBITRUM_RINKEBY,
    `https://arbitrum-rinkeby.infura.io/v3/${infuraId}`,
  ],
  [ChainId.GOERLI, `https://goerli.infura.io/v3/${infuraId}`],
  [ChainId.MUMBAI, `https://polygon-mumbai.infura.io/v3/${infuraId}`],
];

export const providerUrlsTable: Record<number, string> =
  Object.fromEntries(providerUrls);

export const providers: [number, ethers.providers.StaticJsonRpcProvider][] =
  providerUrls.map(([chainId, url]) => {
    return [chainId, new ethers.providers.StaticJsonRpcProvider(url)];
  });
export const providersTable: Record<
  number,
  ethers.providers.StaticJsonRpcProvider
> = Object.fromEntries(providers);

export function getProvider(
  chainId: ChainId = hubPoolChainId
): ethers.providers.StaticJsonRpcProvider {
  // Requires for Cypress testing. Only use the injected test provider if isCypress flag has been added to the window object..
  if ((window as any).isCypress) {
    const provider: ethers.providers.JsonRpcProvider = (window as any).ethereum
      .provider;

    return provider;
  }
  return providersTable[chainId];
}
