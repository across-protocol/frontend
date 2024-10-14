import {
  providers as sdkProviders,
  utils,
  gasPriceOracle,
} from "@across-protocol/sdk";
import { ethers, providers, BigNumber } from "ethers";
import { asL2Provider } from "@eth-optimism/sdk";

import rpcProvidersJson from "../../src/data/rpc-providers.json";

type RpcProviderName = keyof typeof rpcProvidersJson.providers.urls;

const { REACT_APP_PUBLIC_INFURA_ID } = process.env;

export const providerCache: Record<string, providers.StaticJsonRpcProvider> =
  {};

/**
 * Generates a relevant provider for the given input chainId
 * @param _chainId A valid chain identifier where Across is deployed
 * @returns A provider object to query the requested blockchain
 */
export const getProvider = (
  _chainId: number,
  opts = {
    useSpeedProvider: false,
  }
): providers.StaticJsonRpcProvider => {
  const chainId = _chainId.toString();
  const cacheKey = `${chainId}-${opts.useSpeedProvider}`;
  if (!providerCache[cacheKey]) {
    // Resolves provider from urls set in rpc-providers.json.
    const providerFromConfigJson = getProviderFromConfigJson(chainId, opts);
    // Resolves provider from urls set via environment variables.
    // Note that this is legacy and should be removed in the future.
    const override = overrideProvider(chainId);

    if (providerFromConfigJson) {
      providerCache[cacheKey] = providerFromConfigJson;
    } else if (override) {
      providerCache[cacheKey] = override;
    } else {
      providerCache[cacheKey] = infuraProvider(_chainId);
    }
  }
  return providerCache[cacheKey];
};

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

  if (urls.length === 0) {
    console.warn(
      `No provider URL found for chainId ${chainId} in rpc-providers.json`
    );
    return undefined;
  }

  if (!opts.useSpeedProvider) {
    return new sdkProviders.RetryProvider(
      urls.map((url) => [{ url, errorPassThrough: true }, chainId]),
      chainId,
      1, // quorum can be 1 in the context of the API
      3, // retries
      0.5, // delay
      5, // max. concurrency
      "RPC_PROVIDER", // cache namespace
      0 // disable RPC calls logging
    );
  }

  return new sdkProviders.SpeedProvider(
    urls.map((url) => [{ url, errorPassThrough: true }, chainId]),
    chainId,
    3, // max. concurrency used in `SpeedProvider`
    5, // max. concurrency used in `RateLimitedProvider`
    "RPC_PROVIDER", // cache namespace
    1 // disable RPC calls logging
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

/**
 * Resolves an Infura provider given the name of the ETH network
 * @param nameOrChainId The name of an ethereum network
 * @returns A valid Ethers RPC provider
 */
export const infuraProvider = (nameOrChainId: providers.Networkish) => {
  const url = new ethers.providers.InfuraProvider(
    nameOrChainId,
    REACT_APP_PUBLIC_INFURA_ID
  ).connection.url;
  return new ethers.providers.StaticJsonRpcProvider(url);
};

/**
 * Resolves a fixed Static RPC provider if an override url has been specified.
 * @returns A provider or undefined if an override was not specified.
 */
export const overrideProvider = (
  chainId: string
): providers.StaticJsonRpcProvider | undefined => {
  const url = process.env[`REACT_APP_CHAIN_${chainId}_PROVIDER_URL`];
  if (url) {
    return new ethers.providers.StaticJsonRpcProvider(url);
  } else {
    return undefined;
  }
};

/**
 * Resolve the current gas price for a given chain
 * @param chainId The chain ID to resolve the gas price for
 * @returns The gas price in the native currency of the chain
 */
export async function getMaxFeePerGas(chainId: number): Promise<BigNumber> {
  if (utils.chainIsOPStack(chainId)) {
    const l2Provider = asL2Provider(getProvider(chainId));
    return l2Provider.getGasPrice();
  }
  const { maxFeePerGas } = await gasPriceOracle.getGasPriceEstimate(
    getProvider(chainId),
    chainId
  );
  return maxFeePerGas;
}
