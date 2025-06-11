import { useQuery, useQueries, UseQueryOptions } from "@tanstack/react-query";
import { BigNumber } from "ethers";
import { Balance, BalanceStrategy } from "./strategies/types";
import {
  getEcosystem,
  balanceQueryKey,
  TOKEN_SYMBOLS_MAP,
  getNativeTokenSymbol,
} from "utils";
import { zeroBalance } from "./utils";
type StrategyPerEcosystem = {
  evm: BalanceStrategy;
  svm: BalanceStrategy;
};

type BalanceQueryKey = ReturnType<typeof balanceQueryKey>;

type MultiBalanceQuery = UseQueryOptions<
  Balance | undefined,
  Error,
  Balance | undefined,
  BalanceQueryKey
>;

async function fetchBalance(
  queryKey: BalanceQueryKey,
  strategies: StrategyPerEcosystem
): Promise<Balance> {
  const [, chainId, tokenSymbol, account] = queryKey;

  if (!chainId || !tokenSymbol) {
    return zeroBalance;
  }

  const ecosystem = getEcosystem(chainId);
  const strategy = strategies[ecosystem];

  const accountToQuery = account ?? strategy.getAccount();

  if (!accountToQuery) {
    return zeroBalance;
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
      queryFn: async ({ queryKey }) => {
        const { balance } = await fetchBalance(queryKey, strategies);
        return balance;
      },
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
            return zeroBalance;
          }
          return fetchBalance(queryKey, strategies);
        },
        enabled: Boolean(chainId && tokenSymbol),
        refetchInterval: 10_000,
      })),
    });

    return {
      balancesPerChain: result.reduce(
        (acc, { data }, idx) => ({
          ...acc,
          [chainIds[idx]]: {
            balance: data?.balance ?? BigNumber.from(0),
            balanceFormatted: data?.balanceFormatted ?? "0",
            balanceComparable: data?.balanceComparable ?? BigNumber.from(0),
          },
        }),
        {} as Record<
          number,
          {
            balance: BigNumber;
            balanceFormatted: string;
            balanceComparable: BigNumber;
          }
        >
      ),
      isLoading: result.some((s) => s.isLoading),
    };
  };
}
