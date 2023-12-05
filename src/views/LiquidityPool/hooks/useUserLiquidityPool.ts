import { useConnection } from "hooks";
import { useQuery } from "react-query";

import {
  getConfig,
  getPoolClient,
  getBalance,
  getNativeBalance,
  hubPoolChainId,
} from "utils";

const config = getConfig();
const poolClient = getPoolClient();

export function useUserLiquidityPool(tokenSymbol?: string) {
  const { account } = useConnection();

  return useQuery(
    getUserLiquidityPoolQueryKey(tokenSymbol, account),
    () => fetchUserLiquidityPool(account, tokenSymbol),
    {
      enabled: Boolean(account && tokenSymbol),
      staleTime: 300_000,
    }
  );
}

export function getUserLiquidityPoolQueryKey(
  tokenSymbol?: string,
  account?: string
): [string, string?, string?] {
  return ["user-liquidity-pool", tokenSymbol, account];
}

async function fetchUserLiquidityPool(
  userAddress?: string,
  tokenSymbol?: string
) {
  if (!userAddress || !tokenSymbol) {
    return;
  }

  const { logoURI, symbol, l1TokenAddress, decimals } =
    config.getPoolTokenInfoBySymbol(config.getHubPoolChainId(), tokenSymbol);

  const [l1Balance] = await Promise.all([
    tokenSymbol === "ETH"
      ? getNativeBalance(hubPoolChainId, userAddress)
      : getBalance(hubPoolChainId, userAddress, l1TokenAddress),
    poolClient.updateUser(userAddress, l1TokenAddress),
  ]);
  return {
    ...poolClient.getUserState(l1TokenAddress, userAddress),
    l1TokenLogoURI: logoURI,
    l1TokenSymbol: symbol,
    l1TokenDecimals: decimals,
    l1TokenAddress,
    l1Balance,
  };
}
