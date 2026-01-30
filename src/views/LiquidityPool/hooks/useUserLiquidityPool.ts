import { useConnection } from "hooks/useConnection";
import { useQuery } from "@tanstack/react-query";

import { hubPoolChainId } from "utils/constants";
import { getEvmBalance, getNativeBalance } from "utils/token";
import { getConfig } from "utils/config";
import getApiEndpoint from "utils/serverless-api";

const config = getConfig();

export function useUserLiquidityPool(tokenSymbol?: string) {
  const { account } = useConnection();

  return useQuery({
    queryKey: getUserLiquidityPoolQueryKey(tokenSymbol, account),
    queryFn: () => fetchUserLiquidityPool(account, tokenSymbol),
    enabled: Boolean(account && tokenSymbol),
    staleTime: 300_000,
  });
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

  const { logoURI, symbol, displaySymbol, l1TokenAddress, decimals } =
    config.getPoolTokenInfoBySymbol(config.getHubPoolChainId(), tokenSymbol);

  const [l1Balance, poolStateOfUser] = await Promise.all([
    tokenSymbol === "ETH"
      ? getNativeBalance(hubPoolChainId, userAddress)
      : getEvmBalance(hubPoolChainId, userAddress, l1TokenAddress),
    getApiEndpoint().poolsUser(l1TokenAddress, userAddress),
  ]);
  return {
    ...poolStateOfUser,
    l1TokenLogoURI: logoURI,
    l1TokenSymbol: symbol,
    l1TokenDisplaySymbol: displaySymbol,
    l1TokenDecimals: decimals,
    l1TokenAddress,
    l1Balance,
  };
}
