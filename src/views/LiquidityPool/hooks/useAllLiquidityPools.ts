import { QueryFunctionContext, useQueries } from "react-query";

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
        queryKey: ["liquidity-pool", token.address] as [string, string],
        queryFn: ({ queryKey }: QueryFunctionContext<[string, string]>) =>
          fetchPool(queryKey[1]),
      }))
  );
}

async function fetchPool(tokenAddress: string) {
  const { logoURI, symbol, decimals } = config.getTokenInfoByAddress(
    config.getHubPoolChainId(),
    tokenAddress
  );
  await poolClient.updatePool(tokenAddress);
  return {
    ...poolClient.getPoolState(tokenAddress),
    logoURI,
    symbol,
    decimals,
  };
}
