import { QueryFunctionContext, useQueries, useQuery } from "react-query";

import { getConfig, getPoolClient, hubPoolChainId } from "utils";

const config = getConfig();
const poolClient = getPoolClient();

export function useAllLiquidityPools() {
  const tokenList = config.getTokenPoolList(hubPoolChainId);

  return useQueries(
    tokenList.map((token) => ({
      staleTime: 60_000,
      queryKey: getLiquidityPoolQueryKey(token.symbol),
      queryFn: ({ queryKey }: QueryFunctionContext<[string, string?]>) =>
        fetchPool(queryKey[1]),
    }))
  );
}

export function useLiquidityPool(tokenSymbol?: string) {
  return useQuery(
    getLiquidityPoolQueryKey(tokenSymbol),
    () => fetchPool(tokenSymbol),
    {
      staleTime: 60_000,
      enabled: Boolean(tokenSymbol),
    }
  );
}

export function getLiquidityPoolQueryKey(
  l1TokenAddress?: string
): [string, string?] {
  return ["liquidity-pool", l1TokenAddress];
}

async function fetchPool(tokenSymbol?: string) {
  if (!tokenSymbol) {
    return;
  }
  const { logoURI, symbol, decimals, l1TokenAddress } =
    config.getPoolTokenInfoBySymbol(config.getHubPoolChainId(), tokenSymbol);
  await poolClient.updatePool(l1TokenAddress);
  return {
    ...poolClient.getPoolState(l1TokenAddress),
    l1TokenLogoURI: logoURI,
    l1TokenSymbol: symbol,
    l1TokenDecimals: decimals,
    l1TokenAddress,
  };
}
