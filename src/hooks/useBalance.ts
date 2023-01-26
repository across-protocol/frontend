import { useQuery, useQueries } from "react-query";
import { useConnection } from "hooks";
import { useBlock } from "./useBlock";
import { usePrevious } from "hooks";
import {
  getBalance,
  getNativeBalance,
  balanceQueryKey,
  ChainId,
  getConfig,
  ConfigClient,
} from "utils";
import { BigNumber } from "ethers";

export function useNativeBalance(
  tokenSymbol?: string,
  chainId?: ChainId,
  account?: string,
  blockNumber?: number
) {
  const { account: connectedAccount } = useConnection();
  const chainIdToQuery = chainId;
  const tokenSymbolToQuery = tokenSymbol;
  const accountToQuery = account ?? connectedAccount;
  const { block: latestBlock } = useBlock(chainId);
  const blockNumberToQuery = blockNumber ?? latestBlock?.number;
  const enabledQuery =
    !!chainIdToQuery && !!accountToQuery && !!blockNumberToQuery;
  const queryKey = enabledQuery
    ? balanceQueryKey(
        accountToQuery,
        blockNumberToQuery,
        chainIdToQuery,
        tokenSymbolToQuery
      )
    : [
        "DISABLED_BALANCE_QUERY",
        chainIdToQuery,
        tokenSymbolToQuery,
        accountToQuery,
        blockNumberToQuery,
      ];
  const { data: balance, ...delegated } = useQuery(
    queryKey,
    async () => {
      if (!chainIdToQuery) return BigNumber.from(0);
      return getNativeBalance(chainId, accountToQuery!, blockNumberToQuery);
    },
    {
      enabled: enabledQuery,
      // We already re-fetch when the block number changes, so we don't need to re-fetch.
      staleTime: Infinity,
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
    blockNumberToQuery?: number;
    config: ConfigClient;
  }) =>
  async () => {
    const {
      accountToQuery,
      chainIdToQuery,
      tokenSymbolToQuery,
      blockNumberToQuery,
      config,
    } = params;
    if (
      !chainIdToQuery ||
      !tokenSymbolToQuery ||
      !blockNumberToQuery ||
      !accountToQuery
    )
      return BigNumber.from(0);
    const tokenInfo = config.getTokenInfoBySymbol(
      chainIdToQuery,
      tokenSymbolToQuery
    );
    if (tokenInfo.isNative) {
      return getNativeBalance(
        chainIdToQuery,
        accountToQuery,
        blockNumberToQuery
      );
    } else {
      return getBalance(
        chainIdToQuery,
        accountToQuery,
        tokenInfo.address,
        blockNumberToQuery
      );
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
  account?: string,
  blockNumber?: number
) {
  const { account: connectedAccount } = useConnection();
  const chainIdToQuery = chainId;
  const tokenSymbolToQuery = tokenSymbol;
  const accountToQuery = account ?? connectedAccount;
  const { block: latestBlock } = useBlock(chainId);
  const blockNumberToQuery = blockNumber ?? latestBlock?.number;
  const enabledQuery =
    !!chainIdToQuery && !!accountToQuery && !!blockNumberToQuery;
  const queryKey = enabledQuery
    ? balanceQueryKey(
        accountToQuery,
        blockNumberToQuery,
        chainIdToQuery,
        tokenSymbolToQuery
      )
    : [
        "DISABLED_BALANCE_QUERY",
        chainIdToQuery,
        tokenSymbolToQuery,
        accountToQuery,
        blockNumberToQuery,
      ];
  const config = getConfig();
  const { data: balance, ...delegated } = useQuery(
    queryKey,
    QueryBalanceBySymbol({
      config,
      chainIdToQuery,
      tokenSymbolToQuery,
      blockNumberToQuery,
      accountToQuery,
    }),
    {
      enabled: enabledQuery,
      // We already re-fetch when the block number changes, so we don't need to re-fetch.
      staleTime: Infinity,
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
 * @param blockNumber - The block number to execute the query on, if not specified, defaults to the latest block. Note, past blocks require an archive node.
 */
export function useBalancesBySymbols({
  tokenSymbols,
  chainId,
  account,
  blockNumber,
}: {
  tokenSymbols: string[];
  chainId?: ChainId;
  account?: string;
  blockNumber?: number;
}) {
  const config = getConfig();
  const { account: connectedAccount } = useConnection();
  const chainIdToQuery = chainId;
  const accountToQuery = account ?? connectedAccount;
  const { block: latestBlock } = useBlock(chainId);
  const blockNumberToQuery = blockNumber ?? latestBlock?.number;
  const prevAccount = usePrevious(accountToQuery);
  const prevChain = usePrevious(chainIdToQuery);
  const prevTokens = usePrevious(tokenSymbols);
  // Keep the previous data only when blockNumberToQuery changes.
  const keepPreviousData =
    prevAccount === accountToQuery &&
    prevChain === chainIdToQuery &&
    JSON.stringify(prevTokens) === JSON.stringify(tokenSymbols);
  const enabled = !!chainIdToQuery && !!accountToQuery && !!blockNumberToQuery;

  // we use useQueries instead of useQuery so we can share cache values with the singular balance query
  const queries = tokenSymbols.map((tokenSymbolToQuery) => {
    const queryKey = enabled
      ? balanceQueryKey(
          accountToQuery,
          blockNumberToQuery,
          chainIdToQuery,
          tokenSymbolToQuery
        )
      : [
          "DISABLED_BALANCE_QUERY",
          chainIdToQuery,
          tokenSymbolToQuery,
          accountToQuery,
          blockNumberToQuery,
        ];
    const queryFn = QueryBalanceBySymbol({
      config,
      chainIdToQuery,
      tokenSymbolToQuery,
      blockNumberToQuery,
      accountToQuery,
    });
    return {
      queryKey,
      queryFn,
      staleTime: Infinity,
      keepPreviousData,
      enabled,
    };
  });
  const result = useQueries(queries);
  return {
    balances: result.map((result) => result.data),
    isLoading: result.some((s) => s.isLoading),
  };
}
