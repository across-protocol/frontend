import { useQuery, useQueries, UseQueryOptions } from "react-query";
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

const config = getConfig();

// Shared logic for querying by symbol using parameters which might not be available.
const getBalanceBySymbol = async (params: {
  accountToQuery?: string;
  chainIdToQuery?: ChainId;
  tokenSymbolToQuery?: string;
  config: ConfigClient;
}) => {
  const { accountToQuery, chainIdToQuery, tokenSymbolToQuery, config } = params;
  if (!chainIdToQuery || !tokenSymbolToQuery || !accountToQuery)
    return BigNumber.from(0);
  const tokenInfo = config.getTokenInfoBySymbolSafe(
    chainIdToQuery,
    tokenSymbolToQuery
  );
  if (!tokenInfo) {
    return undefined;
  }
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
 * @remarks Passing the zero address as token will return the ETH balance. Passing no account will return the balance of the connected account.
 * @returns The balance of the account and the UseQueryResult object
 */
export function useBalanceBySymbol(
  tokenSymbol?: string,
  chainId?: ChainId,
  account?: string
) {
  const { account: connectedAccount } = useConnection();
  account ??= connectedAccount;

  const { data: balance, ...delegated } = useQuery({
    queryKey: balanceQueryKey(account, chainId, tokenSymbol),
    queryFn: ({ queryKey }) => {
      const [, chainIdToQuery, tokenSymbolToQuery, accountToQuery] = queryKey;
      return getBalanceBySymbol({
        config,
        chainIdToQuery,
        tokenSymbolToQuery,
        accountToQuery,
      });
    },
    enabled: Boolean(chainId && account && tokenSymbol),
    refetchInterval: (_, { queryKey: [, chainId] }) =>
      getChainInfo(chainId || 1).pollingInterval,
  });
  return {
    balance: balance as BigNumber | undefined,
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
  const { account: connectedAccount } = useConnection();
  account ??= connectedAccount;

  const result = useQueries(
    tokenSymbols.map<
      // NOTE: For some reason, we need to explicitly type this as `UseQueryOptions` to avoid a type error.
      UseQueryOptions<
        ReturnType<typeof getBalanceBySymbol>,
        Error,
        ReturnType<typeof getBalanceBySymbol>,
        ReturnType<typeof balanceQueryKey>
      >
    >((tokenSymbolToQuery) => {
      return {
        queryKey: balanceQueryKey(
          account ?? connectedAccount,
          chainId,
          tokenSymbolToQuery
        ),
        queryFn: async ({ queryKey }) => {
          const [, chainIdToQuery, tokenSymbolToQuery, accountToQuery] =
            queryKey;
          return getBalanceBySymbol({
            config,
            chainIdToQuery,
            tokenSymbolToQuery,
            accountToQuery,
          });
        },
        enabled: Boolean(chainId && account && tokenSymbols.length),
        refetchInterval: (_, { queryKey: [, chainId] }) =>
          getChainInfo(chainId || 1).pollingInterval,
      };
    })
  );
  return {
    balances: result.map((result) => result.data) as (BigNumber | undefined)[],
    isLoading: result.some((s) => s.isLoading),
  };
}
