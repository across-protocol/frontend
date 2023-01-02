import { useConnection } from "hooks";
import { useQuery } from "react-query";

import { getConfig, getPoolClient } from "utils";

const config = getConfig();
const poolClient = getPoolClient();

export function useUserLiquidityPool(tokenSymbol?: string) {
  const { account } = useConnection();

  return useQuery(
    ["user-liquidity-pool", tokenSymbol, account],
    () => fetchUserLiquidityPool(account!, tokenSymbol!),
    {
      enabled: Boolean(account && tokenSymbol),
      staleTime: 300_000,
    }
  );
}

async function fetchUserLiquidityPool(
  userAddress: string,
  tokenSymbol: string
) {
  const { logoURI, symbol, l1TokenAddress } = config.getTokenInfoBySymbol(
    config.getHubPoolChainId(),
    tokenSymbol
  );
  await poolClient.updateUser(userAddress, l1TokenAddress);
  return {
    ...poolClient.getUserState(l1TokenAddress, userAddress),
    logoURI,
    symbol,
  };
}
