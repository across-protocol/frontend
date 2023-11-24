import { ethers, providers } from "ethers";
import { hubPoolChainId, ChainId, infuraId, chainInfoTable } from "./constants";

function getInfuraProviderUrl(chainId: number): string | undefined {
  try {
    return new providers.InfuraProvider(chainId, infuraId).connection.url;
  } catch (e) {
    return undefined;
  }
}

function getProviderUrl(chainId: number): string {
  const resolvedRpcUrl =
    chainInfoTable[chainId]?.customRpcUrl ||
    getInfuraProviderUrl(chainId) ||
    chainInfoTable[chainId]?.rpcUrl;
  if (resolvedRpcUrl) {
    return resolvedRpcUrl;
  } else {
    throw new Error(`No provider URL found for chainId ${chainId}`);
  }
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
