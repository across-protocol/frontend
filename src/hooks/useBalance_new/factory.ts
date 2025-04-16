import { useQuery, useQueries, UseQueryOptions } from "@tanstack/react-query";
import { BigNumber } from "ethers";
import { BalanceStrategy } from "./strategies/types";
import {
  getEcosystem,
  balanceQueryKey,
  TOKEN_SYMBOLS_MAP,
  getNativeTokenSymbol,
} from "utils";

type StrategyPerEcosystem = {
  evm: BalanceStrategy;
  svm: BalanceStrategy;
};

type BalanceQueryKey = ReturnType<typeof balanceQueryKey>;

type MultiBalanceQuery = UseQueryOptions<
  BigNumber | undefined,
  Error,
  BigNumber | undefined,
  BalanceQueryKey
>;

async function fetchBalance(
  queryKey: BalanceQueryKey,
  strategies: StrategyPerEcosystem
) {
  const [, chainId, tokenSymbol, account] = queryKey;

  if (!chainId || !tokenSymbol) {
    return BigNumber.from(0);
  }

  const ecosystem = getEcosystem(chainId);
  const strategy = strategies[ecosystem];

  const accountToQuery = account ?? strategy.getAccount();
  console.log("accountToQuery", queryKey, { accountToQuery });

  if (!accountToQuery) {
    return BigNumber.from(0);
  }

  return strategy.getBalance(chainId, tokenSymbol, accountToQuery);
}

export function createBalanceHook(strategies: StrategyPerEcosystem) {
  return function useBalance(
    tokenSymbol?: string,
    chainId?: number,
    account?: string
  ) {
    const { data: balance, ...delegated } = useQuery({
      queryKey: balanceQueryKey(account, chainId, tokenSymbol, "balance"),
      queryFn: ({ queryKey }) => fetchBalance(queryKey, strategies),
      enabled: Boolean(chainId && tokenSymbol),
      refetchInterval: 10_000,
    });

    return {
      balance,
      ...delegated,
    };
  };
}

export function createBalancesBySymbolsHook(strategies: StrategyPerEcosystem) {
  return function useBalancesBySymbols({
    tokenSymbols,
    chainId,
    account,
  }: {
    tokenSymbols: string[];
    chainId?: number;
    account?: string;
  }) {
    const result = useQueries({
      queries: tokenSymbols.map<MultiBalanceQuery>((tokenSymbol) => ({
        queryKey: balanceQueryKey(
          account,
          chainId,
          tokenSymbol,
          "balances-by-symbols"
        ),
        queryFn: ({ queryKey }) => fetchBalance(queryKey, strategies),
        enabled: Boolean(chainId && tokenSymbols.length),
        refetchInterval: 10_000,
      })),
    });
    return {
      balances: result.map((result) => result.data),
      isLoading: result.some((s) => s.isLoading),
    };
  };
}

export function createBalanceBySymbolPerChainHook(
  strategies: StrategyPerEcosystem
) {
  return function useBalanceBySymbolPerChain({
    tokenSymbol,
    chainIds,
    account,
  }: {
    tokenSymbol?: string;
    chainIds: number[];
    account?: string;
  }) {
    const result = useQueries({
      queries: chainIds.map<MultiBalanceQuery>((chainId) => ({
        queryKey: balanceQueryKey(
          account,
          chainId,
          tokenSymbol,
          "balance-by-symbol-per-chain"
        ),
        queryFn: async ({ queryKey }) => {
          const [, chainIdToQuery, tokenSymbolToQuery] = queryKey;
          if (
            tokenSymbolToQuery === TOKEN_SYMBOLS_MAP.ETH.symbol &&
            getNativeTokenSymbol(chainIdToQuery!) !==
              TOKEN_SYMBOLS_MAP.ETH.symbol
          ) {
            return Promise.resolve(BigNumber.from(0));
          }
          return fetchBalance(queryKey, strategies);
        },
        enabled: Boolean(chainId && tokenSymbol),
        refetchInterval: 10_000,
      })),
    });

    return {
      balances: result.reduce(
        (acc, { data }, idx) => ({
          ...acc,
          [chainIds[idx]]: (data ?? BigNumber.from(0)) as BigNumber,
        }),
        {} as Record<number, BigNumber>
      ),
      isLoading: result.some((s) => s.isLoading),
    };
  };
}
