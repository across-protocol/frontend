import { BigNumber, ethers } from "ethers";

import { CHAIN_IDs } from "../_constants";
import {
  buildInternalCacheKey,
  getCachedValue,
  makeCacheGetterAndSetter,
} from "../_cache";
import { getProvider, getMaxFeePerGas } from "./providers";
import {
  getRelayerFeeCalculatorQueries,
  buildDepositForSimulation,
} from "./fee-calculator";
import { getBalance } from "./tokens";
import { isContractDeployedToAddress } from "./sdk";

export function getCachedLatestBlock(chainId: number) {
  const ttlPerChain = {
    default: 2,
    [CHAIN_IDs.MAINNET]: 12,
  };

  return getCachedValue(
    buildInternalCacheKey("latestBlock", chainId),
    ttlPerChain[chainId] || ttlPerChain.default,
    async () => {
      const block = await getProvider(chainId).getBlock("latest");
      return {
        number: block.number,
        timestamp: block.timestamp,
      } as ethers.providers.Block;
    }
  );
}

export function latestBalanceCache(params: {
  chainId: number;
  tokenAddress: string;
  address: string;
}) {
  const { chainId, tokenAddress, address } = params;
  const ttlPerChain = {
    default: 60,
    [CHAIN_IDs.MAINNET]: 60,
  };

  return makeCacheGetterAndSetter(
    buildInternalCacheKey("latestBalance", tokenAddress, chainId, address),
    ttlPerChain[chainId] || ttlPerChain.default,
    () => getBalance(chainId, address, tokenAddress),
    (bnFromCache) => BigNumber.from(bnFromCache)
  );
}

export function isContractCache(chainId: number, address: string) {
  return makeCacheGetterAndSetter(
    buildInternalCacheKey("isContract", chainId, address),
    5 * 24 * 60 * 60, // 5 days - we can cache this for a long time
    async () => {
      const isDeployed = await isContractDeployedToAddress(
        address,
        getProvider(chainId)
      );
      return isDeployed;
    }
  );
}

export function getCachedFillGasUsage(
  deposit: Parameters<typeof buildDepositForSimulation>[0],
  overrides?: Partial<{
    spokePoolAddress: string;
    relayerAddress: string;
  }>
) {
  const ttlPerChain = {
    default: 10,
    [CHAIN_IDs.ARBITRUM]: 10,
  };

  const cacheKey = buildInternalCacheKey(
    "fillGasUsage",
    deposit.destinationChainId,
    deposit.outputToken
  );
  const ttl = ttlPerChain[deposit.destinationChainId] || ttlPerChain.default;
  const fetchFn = async () => {
    const relayerFeeCalculatorQueries = getRelayerFeeCalculatorQueries(
      deposit.destinationChainId,
      overrides
    );
    const { nativeGasCost } = await relayerFeeCalculatorQueries.getGasCosts(
      buildDepositForSimulation(deposit),
      overrides?.relayerAddress
    );
    return nativeGasCost;
  };

  return getCachedValue(cacheKey, ttl, fetchFn, (bnFromCache) =>
    BigNumber.from(bnFromCache)
  );
}

export function latestGasPriceCache(chainId: number) {
  const ttlPerChain = {
    default: 30,
    [CHAIN_IDs.ARBITRUM]: 15,
  };

  return makeCacheGetterAndSetter(
    buildInternalCacheKey("latestGasPriceCache", chainId),
    ttlPerChain[chainId] || ttlPerChain.default,
    () => getMaxFeePerGas(chainId),
    (bnFromCache) => BigNumber.from(bnFromCache)
  );
}
