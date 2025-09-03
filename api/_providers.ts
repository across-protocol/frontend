import * as sdk from "@across-protocol/sdk";
import { PUBLIC_NETWORKS } from "@across-protocol/constants";
import { ethers, providers } from "ethers";

import { providerRedisCache } from "./_cache";
import { getEnvs } from "./_env";
import { getLogger } from "./_logger";

import rpcProvidersJson from "../src/data/rpc-providers.json";
import { SVMProvider } from "@across-protocol/sdk/dist/esm/arch/svm";
import { createSolanaRpc, MainnetUrl } from "@solana/kit";

export type RpcProviderName = keyof typeof rpcProvidersJson.providers.urls;

const { RPC_HEADERS } = getEnvs();

export const providerCache: Record<string, providers.StaticJsonRpcProvider> =
  {};

function getSvmRpcUrl(chainId: number): string {
  const urls = getRpcUrlsFromConfigJson(chainId);
  const publicNetwork = PUBLIC_NETWORKS[chainId];
  if (urls.length === 0 && !publicNetwork) {
    throw new Error(`No provider URL set for SVM chain: ${chainId}`);
  }
  return urls.length > 0 ? urls[0] : publicNetwork.publicRPC;
}

/**
 * Generates a relevant provider for the given input chainId. Has to be used for SVM chains.
 * @param _chainId A valid chain identifier where Across is deployed
 * @returns A provider object to query the requested blockchain
 */
export function getSvmProvider(chainId: number) {
  const clusterUrl = getSvmRpcUrl(chainId);
  return new sdk.providers.SolanaDefaultRpcFactory(clusterUrl, chainId);
}

export function getSVMRpc(
  chainId: number,
  config?: Parameters<typeof createSolanaRpc>[1]
): SVMProvider {
  const clusterUrl = getSvmRpcUrl(chainId) as MainnetUrl;
  return createSolanaRpc(clusterUrl, config) as SVMProvider;
}

/**
 * Generates a relevant provider for the given input chainId
 * @param _chainId A valid chain identifier where Across is deployed
 * @returns A provider object to query the requested blockchain
 */
export function getProvider(
  _chainId: number,
  opts = {
    useSpeedProvider: false,
  }
): providers.StaticJsonRpcProvider {
  const chainId = _chainId.toString();
  const cacheKey = `${chainId}-${opts.useSpeedProvider}`;
  if (!providerCache[cacheKey]) {
    // Resolves provider from urls set in rpc-providers.json.
    const providerFromConfigJson = getProviderFromConfigJson(chainId, opts);
    const publicProvider = getPublicProvider(chainId);

    if (providerFromConfigJson) {
      providerCache[cacheKey] = providerFromConfigJson;
    } else if (publicProvider) {
      providerCache[cacheKey] = publicProvider;
    } else {
      throw new Error(`No provider URL set for chain: ${chainId}`);
    }
  }
  return providerCache[cacheKey];
}

// For most chains, we can cache immediately.
const DEFAULT_CACHE_BLOCK_DISTANCE = 0;

// For chains that can reorg (mainnet and polygon), establish a buffer beyond which reorgs are rare.
const CUSTOM_CACHE_BLOCK_DISTANCE: Record<number, number> = {
  1: 2,
  137: 10,
};

function getCacheBlockDistance(chainId: number) {
  const cacheBlockDistance = CUSTOM_CACHE_BLOCK_DISTANCE[chainId];
  if (!cacheBlockDistance) {
    return DEFAULT_CACHE_BLOCK_DISTANCE;
  }
  return cacheBlockDistance;
}

/**
 * Resolves a fixed Static RPC provider if an override url has been specified.
 * @returns A provider or undefined if an override was not specified.
 */
export function getPublicProvider(
  chainId: string
): providers.StaticJsonRpcProvider | undefined {
  const chain = PUBLIC_NETWORKS[Number(chainId)];
  if (chain) {
    const headers = getProviderHeaders(chainId);
    return new ethers.providers.StaticJsonRpcProvider({
      url: chain.publicRPC,
      headers,
    });
  } else {
    return undefined;
  }
}

/**
 * Resolves a provider from the `rpc-providers.json` configuration file.
 */
function getProviderFromConfigJson(
  _chainId: string,
  opts = {
    useSpeedProvider: false,
  }
) {
  const chainId = Number(_chainId);
  const urls = getRpcUrlsFromConfigJson(chainId);
  const headers = getProviderHeaders(chainId);

  if (urls.length === 0) {
    getLogger().warn({
      at: "getProviderFromConfigJson",
      message: `No provider URL found for chainId ${chainId} in rpc-providers.json`,
    });
    return undefined;
  }

  if (!opts.useSpeedProvider) {
    return new sdk.providers.RetryProvider(
      urls.map((url) => [{ url, headers, errorPassThrough: true }, chainId]),
      chainId,
      1, // quorum can be 1 in the context of the API
      3, // retries
      0.5, // delay
      5, // max. concurrency
      `RPC_PROVIDER_${process.env.RPC_CACHE_NAMESPACE}`, // cache namespace
      0, // disable RPC calls logging
      providerRedisCache,
      getCacheBlockDistance(chainId)
    );
  }

  return new sdk.providers.SpeedProvider(
    urls.map((url) => [{ url, headers, errorPassThrough: true }, chainId]),
    chainId,
    3, // max. concurrency used in `SpeedProvider`
    5, // max. concurrency used in `RateLimitedProvider`
    `RPC_PROVIDER_${process.env.RPC_CACHE_NAMESPACE}`, // cache namespace
    0, // disable RPC calls logging
    providerRedisCache,
    getCacheBlockDistance(chainId)
  );
}

export function getRpcUrlsFromConfigJson(chainId: number) {
  const urls: string[] = [];

  const { providers } = rpcProvidersJson;
  const enabledProviders: RpcProviderName[] =
    (providers.enabled as Record<string, RpcProviderName[]>)[chainId] ||
    providers.enabled.default;

  for (const provider of enabledProviders) {
    const providerUrl = (providers.urls[provider] as Record<string, string>)?.[
      chainId
    ];
    if (providerUrl) {
      urls.push(providerUrl);
    }
  }

  return urls;
}

export function getProviderHeaders(
  chainId: number | string
): Record<string, string> | undefined {
  const rpcHeaders = JSON.parse(RPC_HEADERS ?? "{}") as Record<
    string,
    Record<string, string>
  >;

  return rpcHeaders?.[String(chainId)];
}
