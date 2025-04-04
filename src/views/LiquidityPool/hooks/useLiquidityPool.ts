import {
  QueryFunctionContext,
  useQueries,
  useQuery,
} from "@tanstack/react-query";

import { getConfig, hubPoolChainId } from "utils";
import getApiEndpoint from "utils/serverless-api";

const config = getConfig();

export function useAllLiquidityPools() {
  const tokenList = config.getTokenPoolList(hubPoolChainId);

  return useQueries({
    queries: tokenList.map((token) => ({
      staleTime: 60_000,
      queryKey: getLiquidityPoolQueryKey(token.symbol),
      queryFn: ({ queryKey }: QueryFunctionContext<[string, string?]>) =>
        fetchPool(queryKey[1]),
    })),
  });
}

export function useLiquidityPool(tokenSymbol?: string) {
  return useQuery({
    queryKey: getLiquidityPoolQueryKey(tokenSymbol),
    queryFn: () => fetchPool(tokenSymbol),
    staleTime: 60_000,
    enabled: Boolean(tokenSymbol),
  });
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
  const { logoURI, symbol, displaySymbol, decimals, l1TokenAddress } =
    config.getPoolTokenInfoBySymbol(config.getHubPoolChainId(), tokenSymbol);
  const pool = await getApiEndpoint().pools(l1TokenAddress);
  return {
    ...pool,
    l1TokenLogoURI: logoURI,
    l1TokenSymbol: symbol,
    l1TokenDisplaySymbol: displaySymbol,
    l1TokenDecimals: decimals,
    l1TokenAddress,
  };
}
