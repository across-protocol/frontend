import { useQuery } from "react-query";
import { useConnection } from "state/hooks";
import { useBlock } from "./useBlock";
import {
  getBalance,
  getBalances,
  balanceQueryKey,
  balancesQueryKey,
  ChainId,
} from "utils";
import { usePrevious } from "hooks";

/**
 * @param token - The token to fetch the balance of.
 * @param chainId - The chain Id of the chain to execute the query on. If not specified, defaults to the chainId the user is connected to or undefined.
 * @param account - The account to query the balance of.
 * @param blockNumber - The block number to execute the query on, if not specified, defaults to the latest block. Note, past blocks require an archive node.
 * @remarks Passing the zero address as token will return the ETH balance. Passing no account will return the balance of the connected account.
 * @returns The balance of the account and the UseQueryResult object
 */
export function useBalance(
  token: string,
  chainId?: ChainId,
  account?: string,
  blockNumber?: number
) {
  const { chainId: connectedChainId, account: connectedAccount } =
    useConnection();
  const chainIdToQuery = chainId ?? connectedChainId;
  const accountToQuery = account ?? connectedAccount;
  const { block: latestBlock } = useBlock(chainId);
  const blockNumberToQuery = blockNumber ?? latestBlock?.number;
  const enabledQuery =
    !!chainIdToQuery && !!accountToQuery && !!blockNumberToQuery;
  const queryKey = enabledQuery
    ? balanceQueryKey(chainIdToQuery, token, accountToQuery, blockNumberToQuery)
    : [
        "DISABLED_BALANCE_QUERY",
        { chainIdToQuery, token, accountToQuery, blockNumberToQuery },
      ];
  const { data: balance, ...delegated } = useQuery(
    queryKey,
    async () => {
      const balance = await getBalance(
        chainId!,
        token,
        accountToQuery!,
        blockNumberToQuery
      );
      return balance;
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

/**
 *
 * @param tokens - The tokens to fetch the balance of.
 * @param chainId - The chain Id of the chain to execute the query on. If not specified, defaults to the chainId the user is connected to or undefined.
 * @param account - The account to query the balances of.
 * @param blockNumber - The block number to execute the query on, if not specified, defaults to the latest block. Note, past blocks require an archive node.
 */
export function useBalances(
  tokens: string[],
  chainId?: ChainId,
  account?: string,
  blockNumber?: number
) {
  const { chainId: connectedChainId, account: connectedAccount } =
    useConnection();
  const chainIdToQuery = chainId ?? connectedChainId;
  const accountToQuery = account ?? connectedAccount;
  const { block: latestBlock } = useBlock(chainId);
  const blockNumberToQuery = blockNumber ?? latestBlock?.number;
  // To fetch balances, we need a list of tokens, an account to get balances of, and a specified chainId.
  const enabledQuery =
    !!chainIdToQuery &&
    !!accountToQuery &&
    tokens.length > 0 &&
    !!blockNumberToQuery;
  const queryKey = enabledQuery
    ? balancesQueryKey(
        chainIdToQuery,
        tokens,
        accountToQuery,
        blockNumberToQuery
      )
    : [
        "DISABLED_BALANCES_QUERY",
        { chainIdToQuery, tokens, accountToQuery, blockNumberToQuery },
      ];
  const prevAccount = usePrevious(accountToQuery);
  const prevChain = usePrevious(chainIdToQuery);
  const prevTokens = usePrevious(tokens);
  // Keep the previous data only when blockNumberToQuery changes.
  const keepPreviousData =
    prevAccount === accountToQuery &&
    prevChain === chainIdToQuery &&
    JSON.stringify(prevTokens) === JSON.stringify(tokens);
  const { data: balances, ...delegated } = useQuery(
    queryKey,
    async () => {
      const balances = await getBalances(
        chainId!,
        tokens,
        accountToQuery!,
        blockNumberToQuery
      );
      return balances;
    },
    {
      enabled: enabledQuery,
      // We already re-fetch when the block change, so we don't need to re-fetch.
      staleTime: Infinity,
      // Old balances can be garbage collected immediately
      cacheTime: 0,
      keepPreviousData,
    }
  );
  return {
    balances,
    ...delegated,
  };
}
