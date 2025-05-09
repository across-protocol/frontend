import { useQuery, useQueries, UseQueryOptions } from "@tanstack/react-query";
import { useConnection } from "hooks";
import {
  getBalance,
  getNativeBalance,
  balanceQueryKey,
  ChainId,
  getConfig,
  ConfigClient,
  getChainInfo,
  TOKEN_SYMBOLS_MAP,
  getNativeTokenSymbol,
  formatUnitsWithMaxFractions,
} from "utils";
import { BigNumber, providers } from "ethers";
import { ConvertDecimals } from "utils/convertdecimals";

const config = getConfig();

const equivalentBalanceTokens = {
  USDC: "USDC-BNB",
  USDT: "USDT-BNB",
  "USDC-BNB": "USDC",
  "USDT-BNB": "USDT",
};

const zeroBalance = {
  balance: BigNumber.from(0),
  balanceFormatted: "0",
  balanceComparable: BigNumber.from(0),
};

/**
 * Returns the balance of the account by symbol.
 * @param params - The parameters for the balance query.
 * @param params.accountToQuery - The account to query the balance of.
 * @param params.chainIdToQuery - The chain id to query the balance on.
 * @param params.tokenSymbolToQuery - The token symbol to query the balance of.
 * @param params.config - The config to use for the balance query.
 * @param params.provider - The provider to use for the balance query.
 * @returns The balance in different formats of the account by symbol.
 * @example
 * ```ts
 * const {
 *   // Denominated in the token's decimals.
 *   balance,
 *   // Human readable balance.
 *   balanceFormatted,
 *   // Denominated in 18 decimals. Can be used for comparisons for tokens with the same
 *   // symbol but different decimals, e.g. USDC/USDT on BSC.
 *   balanceComparable,
 * } = getBalanceBySymbol(
 *   // ...args
 * );
 */
const getBalanceBySymbol = async (params: {
  accountToQuery?: string;
  chainIdToQuery?: ChainId;
  tokenSymbolToQuery?: string;
  config: ConfigClient;
  provider?: providers.JsonRpcProvider | providers.FallbackProvider;
}): Promise<{
  balance: BigNumber;
  balanceFormatted: string;
  balanceComparable: BigNumber;
}> => {
  const {
    accountToQuery,
    chainIdToQuery,
    tokenSymbolToQuery,
    config,
    provider,
  } = params;
  if (!chainIdToQuery || !tokenSymbolToQuery || !accountToQuery)
    return zeroBalance;
  let tokenInfo = config.getTokenInfoBySymbolSafe(
    chainIdToQuery,
    tokenSymbolToQuery
  );
  let addressToQuery = tokenInfo?.addresses?.[chainIdToQuery];
  const equivalentBalanceTokenSymbol =
    equivalentBalanceTokens[
      tokenSymbolToQuery as keyof typeof equivalentBalanceTokens
    ];
  if (!addressToQuery && equivalentBalanceTokenSymbol) {
    tokenInfo = config.getTokenInfoBySymbolSafe(
      chainIdToQuery,
      equivalentBalanceTokenSymbol
    );
    addressToQuery = tokenInfo?.addresses?.[chainIdToQuery];
  }
  if (!addressToQuery) {
    return zeroBalance;
  }
  const balance = tokenInfo?.isNative
    ? await getNativeBalance(chainIdToQuery, accountToQuery, "latest", provider)
    : await getBalance(
        chainIdToQuery,
        accountToQuery,
        addressToQuery,
        "latest",
        provider
      );
  const balanceDecimals = tokenInfo?.decimals ?? 18;
  return {
    balance,
    // We convert the balance to 18 decimals to be able to compare balances of tokens
    // with the same symbol but different decimals, e.g. USDC/USDT on BSC.
    balanceComparable: ConvertDecimals(balanceDecimals, 18)(balance),
    balanceFormatted: formatUnitsWithMaxFractions(balance, balanceDecimals),
  };
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

  const { data, ...delegated } = useQuery({
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
    refetchInterval: getChainInfo(chainId || 1).pollingInterval || 10_000,
  });
  return {
    balance: data?.balance ?? BigNumber.from(0),
    balanceFormatted: data?.balanceFormatted ?? "0",
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
        Awaited<ReturnType<typeof getBalanceBySymbol>>,
        Error,
        Awaited<ReturnType<typeof getBalanceBySymbol>>,
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
    balances: result.map((result) => result.data?.balance),
    balancesFormatted: result.map((result) => result.data?.balanceFormatted),
    isLoading: result.some((s) => s.isLoading),
  };
}

export function useBalanceBySymbolPerChain({
  tokenSymbol,
  chainIds,
  account,
}: {
  tokenSymbol?: string;
  chainIds: ChainId[];
  account?: string;
}) {
  const result = useQueries({
    queries: chainIds.map<
      // NOTE: For some reason, we need to explicitly type this as `UseQueryOptions` to avoid a type error.
      UseQueryOptions<
        Awaited<ReturnType<typeof getBalanceBySymbol>>,
        Error,
        Awaited<ReturnType<typeof getBalanceBySymbol>>,
        ReturnType<typeof balanceQueryKey>
      >
    >((chainId) => ({
      queryKey: balanceQueryKey(account, chainId, tokenSymbol),
      queryFn: async ({ queryKey }) => {
        const [, chainIdToQuery, tokenSymbolToQuery, accountToQuery] = queryKey;
        if (
          tokenSymbolToQuery === TOKEN_SYMBOLS_MAP.ETH.symbol &&
          getNativeTokenSymbol(chainIdToQuery!) !== TOKEN_SYMBOLS_MAP.ETH.symbol
        ) {
          return zeroBalance;
        }
        return getBalanceBySymbol({
          config,
          chainIdToQuery,
          tokenSymbolToQuery,
          accountToQuery,
        });
      },
      enabled: Boolean(account && tokenSymbol),
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
}
