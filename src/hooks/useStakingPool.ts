import { useQuery, useQueries, QueryFunctionContext } from "react-query";
import { BigNumber } from "ethers";

import { getConfig, hubPoolChainId, defaultRefetchInterval } from "utils";
import { useConnection } from "hooks/useConnection";
import { fetchStakingPool } from "utils/staking-pool";

import { useCoingeckoPrice } from "./useCoingeckoPrice";

const config = getConfig();

export function useStakingPool(tokenAddress?: string) {
  const { account } = useConnection();

  const acxPriceQuery = useCoingeckoPrice(
    config.getAcrossTokenAddress(),
    "usd"
  );
  const acxPrice = acxPriceQuery.data?.price;

  const stakingPoolQuery = useQuery(
    getStakingPoolQueryKey(tokenAddress, account),
    ({ queryKey: keys }) => fetchStakingPool(keys[1], keys[2], acxPrice),
    {
      refetchInterval: defaultRefetchInterval,
      enabled: Boolean(tokenAddress) && Boolean(acxPrice),
    }
  );

  return {
    ...stakingPoolQuery,
    isLoading: stakingPoolQuery.isLoading || acxPriceQuery.isLoading,
  };
}

export function useAllStakingPools() {
  const { account } = useConnection();

  const tokenList = config.getStakingPoolTokenList(hubPoolChainId);

  const acxPriceQuery = useCoingeckoPrice(
    config.getAcrossTokenAddress(),
    "usd"
  );
  const acxPrice = acxPriceQuery.data?.price;

  const batchedPoolQueries = useQueries(
    tokenList
      .filter((token) => !token.isNative)
      .map((token) => ({
        enabled: Boolean(acxPrice),
        refetchInterval: defaultRefetchInterval,
        queryKey: getStakingPoolQueryKey(token.address, account),
        queryFn: ({
          queryKey,
        }: QueryFunctionContext<[string, string?, string?]>) =>
          fetchStakingPool(queryKey[1], queryKey[2], acxPrice),
      }))
  );

  return batchedPoolQueries.map((query) => ({
    ...query,
    isLoading: query.isLoading || acxPriceQuery.isLoading,
  }));
}

export function useMaxApyOfAllStakingPools() {
  const allStakingPoolQueries = useAllStakingPools();

  const isLoading = allStakingPoolQueries.some((query) => query.isLoading);
  const allMaxApys = allStakingPoolQueries
    .map((query) => query.data?.apyData.maxApy || BigNumber.from(0))
    .sort((a, b) => (a.lt(b) ? -1 : a.gt(b) ? 1 : 0));
  const [maxApyOfAllStakingPools] = allMaxApys.slice(-1);
  return { isLoading, maxApyOfAllStakingPools, allMaxApys };
}

export function useAcrossStakingPool() {
  const acrossTokenAddress = config.getAcrossTokenAddress();
  return useStakingPool(acrossTokenAddress);
}

export function getStakingPoolQueryKey(
  tokenAddress?: string,
  account?: string
): [string, string?, string?] {
  return ["staking-pool", tokenAddress, account];
}
