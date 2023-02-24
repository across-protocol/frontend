import { BigNumber, utils } from "ethers";
import { useConnection } from "hooks";
import {
  ChainId,
  fixedPointAdjustment,
  getBalance,
  getConfig,
  getNativeBalance,
  getRoutes,
  getToken,
  reportTotalWalletUsdBalance,
} from "utils";
import { ConvertDecimals } from "utils/convertdecimals";
import getApiEndpoint from "utils/serverless-api";
import Sentry from "utils/sentry";
import { useQuery } from "react-query";

export function useWalletBalanceTrace() {
  const { account } = useConnection();

  useQuery(
    ["wallet-balance", account ?? "loading"],
    async () => {
      if (!account) return;
      try {
        const balance = await calculateUsdBalances(account);
        reportTotalWalletUsdBalance(balance);
        return balance;
      } catch (e) {
        console.error("Failed to fetch balances:", e);
        Sentry.captureException(e);
        throw e; // Throw the error so that react-query can retry
      }
    },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      retry: 5,
      retryDelay: 3000,
    }
  );

  type TokenSymbolAddressType = {
    fromTokenSymbol: string;
    fromTokenAddress: string;
  };
  const availableTokens: Record<number, TokenSymbolAddressType[]> = getRoutes(
    getConfig().getHubPoolChainId()
  ).routes.reduce((acc, route) => {
    const { fromChain, fromTokenSymbol, fromTokenAddress } = route;
    const payload = { fromTokenSymbol, fromTokenAddress };

    if (!acc[fromChain]?.some((t) => t.fromTokenAddress === fromTokenAddress)) {
      acc[fromChain] = [...(acc[fromChain] ?? []), payload];
    }
    return acc;
  }, {} as Record<number, TokenSymbolAddressType[]>);

  const availableSymbols = [
    ...new Set(getRoutes(ChainId.MAINNET).routes.map((r) => r.fromTokenSymbol)),
  ];

  const calculateUsdBalances = async (account: string) => {
    const coingeckoPrices = await Promise.all(
      availableSymbols.map((symbol) =>
        getApiEndpoint().coingecko(getToken(symbol).mainnetAddress!, "usd")
      )
    );
    const usdPrices: Record<string, BigNumber> = coingeckoPrices.reduce(
      (acc, { price }, i) => {
        return { ...acc, [availableSymbols[i]]: price };
      },
      {}
    );

    const balances = (
      await Promise.all(
        Object.entries(availableTokens).flatMap(async ([chainId, tokens]) => {
          const promises = tokens.map(
            async ({ fromTokenSymbol, fromTokenAddress }) => ({
              fromTokenSymbol,
              fromTokenAddress,
              balance: await getBalance(
                Number(chainId),
                account,
                fromTokenAddress
              ),
            })
          );
          if (chainId !== "137") {
            const fn = async () => {
              return {
                fromTokenSymbol: "ETH",
                fromTokenAddress: "0x0000000000000000000000000000000000000000",
                balance: await getNativeBalance(Number(chainId), account),
              };
            };
            promises.push(fn());
          }
          return await Promise.all(promises);
        })
      )
    ).flat(2);

    const totalBalance = balances.reduce(
      (acc, { fromTokenSymbol, balance }) => {
        const token = getToken(fromTokenSymbol);
        const usdPrice = usdPrices[fromTokenSymbol];
        const usdBalance = Number(
          utils.formatUnits(
            usdPrice
              .mul(ConvertDecimals(token.decimals, 18)(balance))
              .div(fixedPointAdjustment),
            18
          )
        );
        return acc + usdBalance;
      },
      0
    );

    return totalBalance;
  };
}
