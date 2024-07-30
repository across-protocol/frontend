import { useQuery, useQueries, UseQueryOptions } from "@tanstack/react-query";
import { useConnection } from "hooks";
import {
  getBalance,
  getNativeBalance,
  balanceQueryKey,
  ChainId,
  getConfig,
  ConfigClient,
} from "utils";
import { BigNumber, providers } from "ethers";

const config = getConfig();

// Shared logic for querying by symbol using parameters which might not be available.
const getBalanceBySymbol = async (params: {
  accountToQuery?: string;
  chainIdToQuery?: ChainId;
  tokenSymbolToQuery?: string;
  config: ConfigClient;
  provider?: providers.JsonRpcProvider;
}) => {
  const {
    accountToQuery,
    chainIdToQuery,
    tokenSymbolToQuery,
    config,
    provider,
  } = params;
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
    return getNativeBalance(chainIdToQuery, accountToQuery, "latest", provider);
  } else {
    return getBalance(
      chainIdToQuery,
      accountToQuery,
      tokenInfo.address,
      "latest",
      provider
    );
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
  const {
    account: connectedAccount,
    provider,
    chainId: connectedChainId,
  } = useConnection();
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
        provider:
          chainIdToQuery === connectedChainId && provider
            ? provider
            : undefined,
      });
    },
    enabled: Boolean(chainId && account && tokenSymbol),
    refetchInterval: 10_000,
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
  const {
    account: connectedAccount,
    chainId: connectedChainId,
    provider,
  } = useConnection();
  account ??= connectedAccount;

  const result = useQueries({
    queries: tokenSymbols.map<
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
        queryFn: ({ queryKey }) => {
          const [, chainIdToQuery, tokenSymbolToQuery, accountToQuery] =
            queryKey;
          return getBalanceBySymbol({
            config,
            chainIdToQuery,
            tokenSymbolToQuery,
            accountToQuery,
            provider:
              chainIdToQuery === connectedChainId && provider
                ? provider
                : undefined,
          });
        },
        enabled: Boolean(chainId && account && tokenSymbols.length),
        refetchInterval: 10_000,
      };
    }),
  });
  return {
    balances: result.map((result) => result.data) as (BigNumber | undefined)[],
    isLoading: result.some((s) => s.isLoading),
  };
}
