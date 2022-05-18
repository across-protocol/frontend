import { useQuery } from "react-query";
import { useConnection } from "state/hooks";
import { useBlock } from "./useBlock";
import {
  getBalance,
  getNativeBalance,
  getBalancesBySymbols,
  balanceQueryKey,
  balancesQueryKey,
  ChainId,
  getConfig,
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
        {
          chainIdToQuery,
          tokenSymbolToQuery,
          accountToQuery,
          blockNumberToQuery,
        },
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
        {
          chainIdToQuery,
          tokenSymbolToQuery,
          accountToQuery,
          blockNumberToQuery,
        },
      ];
  const config = getConfig();
  const { data: balance, ...delegated } = useQuery(
    queryKey,
    async () => {
      if (!chainIdToQuery || !tokenSymbolToQuery) return BigNumber.from(0);
      const tokenInfo = config.getTokenInfoBySymbol(
        chainIdToQuery,
        tokenSymbolToQuery
      );
      if (tokenInfo.isNative) {
        return getNativeBalance(chainId, accountToQuery!, blockNumberToQuery);
      } else {
        return getBalance(
          chainId,
          accountToQuery!,
          tokenInfo.address,
          blockNumberToQuery
        );
      }
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
export function useBalancesBySymbols(
  tokenSymbols: string[],
  chainId?: ChainId,
  account?: string,
  blockNumber?: number
) {
  const { account: connectedAccount } = useConnection();
  const chainIdToQuery = chainId;
  const accountToQuery = account ?? connectedAccount;
  const { block: latestBlock } = useBlock(chainId);
  const blockNumberToQuery = blockNumber ?? latestBlock?.number;
  // To fetch balances, we need a list of tokens, an account to get balances of, and a specified chainId.
  const enabledQuery =
    !!chainIdToQuery && !!accountToQuery && !!blockNumberToQuery;
  const queryKey = enabledQuery
    ? balancesQueryKey(
        tokenSymbols,
        accountToQuery,
        blockNumberToQuery,
        chainIdToQuery
      )
    : [
        "DISABLED_BALANCES_QUERY",
        { chainIdToQuery, tokenSymbols, accountToQuery, blockNumberToQuery },
      ];
  const { data: balances, ...delegated } = useQuery(
    queryKey,
    async () => {
      return getBalancesBySymbols(
        chainId!,
        tokenSymbols,
        accountToQuery!,
        blockNumberToQuery
      );
    },
    {
      enabled: enabledQuery,
      // We already re-fetch when the block change, so we don't need to re-fetch.
      staleTime: Infinity,
    }
  );
  return {
    balances,
    ...delegated,
  };
}
