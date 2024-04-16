import { useQuery, useQueries } from "react-query";
import { useConnection } from "hooks";
import {
  getBalance,
  getNativeBalance,
  balanceQueryKey,
  ChainId,
  getConfig,
  ConfigClient,
  getChainInfo,
} from "utils";
import { BigNumber } from "ethers";

export function useNativeBalance(
  tokenSymbol?: string,
  chainId?: ChainId,
  account?: string
) {
  const { account: connectedAccount } = useConnection();
  const chainIdToQuery = chainId;
  const tokenSymbolToQuery = tokenSymbol;
  const accountToQuery = account ?? connectedAccount;
  const enabledQuery = !!chainIdToQuery && !!accountToQuery;
  const queryKey = enabledQuery
    ? balanceQueryKey(accountToQuery, chainIdToQuery, tokenSymbolToQuery)
    : [
        "DISABLED_BALANCE_QUERY",
        chainIdToQuery,
        tokenSymbolToQuery,
        accountToQuery,
      ];
  const { data: balance, ...delegated } = useQuery(
    queryKey,
    async () => {
      if (!chainIdToQuery) return BigNumber.from(0);
      return getNativeBalance(chainId, accountToQuery!);
    },
    {
      enabled: enabledQuery,
      refetchInterval: getChainInfo(chainIdToQuery || 1).pollingInterval,
    }
  );
  return {
    balance,
    ...delegated,
  };
}

// Shared logic for querying by symbol using parameters which might not be available.
const QueryBalanceBySymbol =
  (params: {
    accountToQuery?: string;
    chainIdToQuery?: ChainId;
    tokenSymbolToQuery?: string;
    config: ConfigClient;
  }) =>
  async () => {
    const { accountToQuery, chainIdToQuery, tokenSymbolToQuery, config } =
      params;
    if (!chainIdToQuery || !tokenSymbolToQuery || !accountToQuery)
      return BigNumber.from(0);
    const tokenInfo = config.getTokenInfoBySymbol(
      chainIdToQuery,
      tokenSymbolToQuery
    );
    if (tokenInfo.isNative) {
      return getNativeBalance(chainIdToQuery, accountToQuery);
    } else {
      return getBalance(chainIdToQuery, accountToQuery, tokenInfo.address);
    }
  };
/**
 * @param token - The token to fetch the balance of.
 * @param chainId - The chain Id of the chain to execute the query on. If not specified, defaults to the chainId the user is connected to or undefined.
 * @param account - The account to query the balance of.
 * @param blockNumber - The block number to execute the query on, if not specified, defaults to the latest block. Note, past blocks require an archive node.
 * @remarks Passing the zero address as token will return the ETH balance. Passing no account will return the balance of the connected account.
 * @returns The balance of the account and the UseQueryResult object
 */
export function useBalanceBySymbol(
  tokenSymbol?: string,
  chainId?: ChainId,
  account?: string
) {
  const { account: connectedAccount } = useConnection();
  const chainIdToQuery = chainId;
  const tokenSymbolToQuery = tokenSymbol;
  const accountToQuery = account ?? connectedAccount;
  const enabledQuery = !!chainIdToQuery && !!accountToQuery;
  const queryKey = enabledQuery
    ? balanceQueryKey(accountToQuery, chainIdToQuery, tokenSymbolToQuery)
    : [
        "DISABLED_BALANCE_QUERY",
        chainIdToQuery,
        tokenSymbolToQuery,
        accountToQuery,
      ];
  const config = getConfig();
  const { data: balance, ...delegated } = useQuery(
    queryKey,
    QueryBalanceBySymbol({
      config,
      chainIdToQuery,
      tokenSymbolToQuery,
      accountToQuery,
    }),
    {
      enabled: enabledQuery,
      refetchInterval: getChainInfo(chainIdToQuery || 1).pollingInterval,
    }
  );
  return {
    balance,
    ...delegated,
  };
}

/**
 *
 * @param tokens - The tokens to fetch the balance of.
 * @param chainId - The chain Id of the chain to execute the query on. If not specified, defaults to the chainId the user is connected to or undefined.
 * @param account - The account to query the balances of.
 */
export function useBalancesBySymbols({
  tokenSymbols,
  chainId,
  account,
}: {
  tokenSymbols: string[];
  chainId?: ChainId;
  account?: string;
}) {
  const config = getConfig();
  const { account: connectedAccount } = useConnection();
  const chainIdToQuery = chainId;
  const accountToQuery = account ?? connectedAccount;
  const enabled = !!chainIdToQuery && !!accountToQuery;

  // we use useQueries instead of useQuery so we can share cache values with the singular balance query
  const queries = tokenSymbols.map((tokenSymbolToQuery) => {
    const queryKey = enabled
      ? balanceQueryKey(accountToQuery, chainIdToQuery, tokenSymbolToQuery)
      : [
          "DISABLED_BALANCE_QUERY",
          chainIdToQuery,
          tokenSymbolToQuery,
          accountToQuery,
        ];
    const queryFn = QueryBalanceBySymbol({
      config,
      chainIdToQuery,
      tokenSymbolToQuery,
      accountToQuery,
    });
    return {
      queryKey,
      queryFn,
      enabled,
      refetchInterval: getChainInfo(chainIdToQuery || 1).pollingInterval,
    };
  });
  const result = useQueries(queries);
  return {
    balances: result.map((result) => result.data),
    isLoading: result.some((s) => s.isLoading),
  };
}
