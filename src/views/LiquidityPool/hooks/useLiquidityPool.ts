import { QueryFunctionContext, useQueries, useQuery } from "react-query";

import { getConfig, getPoolClient, hubPoolChainId } from "utils";

const config = getConfig();
const poolClient = getPoolClient();

export function useAllLiquidityPools() {
  const tokenList = config.getTokenList(hubPoolChainId);

  return useQueries(
    tokenList
      .filter((token) => !token.isNative)
      .map((token) => ({
        staleTime: 60_000,
        queryKey: getLiquidityPoolQueryKey(token.l1TokenAddress),
        queryFn: ({ queryKey }: QueryFunctionContext<[string, string?]>) =>
          fetchPool(queryKey[1]),
      }))
  );
}

export function useLiquidityPool(l1TokenAddress?: string) {
  return useQuery(
    getLiquidityPoolQueryKey(l1TokenAddress),
    () => fetchPool(l1TokenAddress),
    {
      staleTime: 60_000,
      enabled: Boolean(l1TokenAddress),
    }
  );
}

export function getLiquidityPoolQueryKey(
  l1TokenAddress?: string
): [string, string?] {
  return ["liquidity-pool", l1TokenAddress];
}

async function fetchPool(tokenAddress?: string) {
  if (!tokenAddress) {
    return;
  }
  const { logoURI, symbol, decimals, l1TokenAddress } =
    config.getTokenInfoByAddress(config.getHubPoolChainId(), tokenAddress);
  await poolClient.updatePool(tokenAddress);
  return {
    ...poolClient.getPoolState(tokenAddress),
    l1TokenLogoURI: logoURI,
    l1TokenSymbol: symbol,
    l1TokenDecimals: decimals,
    l1TokenAddress,
  };
}
