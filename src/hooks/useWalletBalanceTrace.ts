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
  reportTokenBalance,
  reportTotalWalletUsdBalance,
  setUserId,
} from "utils";
import { ConvertDecimals } from "utils/convertdecimals";
import getApiEndpoint from "utils/serverless-api";
import { useQuery } from "@tanstack/react-query";
import { CHAIN_IDs } from "@across-protocol/constants";

export function useWalletBalanceTrace() {
  const { account } = useConnection();

  return useQuery({
    enabled: Boolean(account),
    queryKey: ["wallet-balance", account],
    queryFn: async () => {
      if (!account) return;
      setUserId(account);
      const balance = await calculateUsdBalances(account);
      reportTotalWalletUsdBalance(balance);
      return balance;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 5,
    retryDelay: 3000,
  });
}

type TokenSymbolAddressType = {
  fromTokenSymbol: string;
  fromTokenAddress: string;
};
const availableTokens: Record<number, TokenSymbolAddressType[]> = getRoutes(
  getConfig().getHubPoolChainId()
).routes.reduce(
  (acc, route) => {
    const { fromChain, fromTokenSymbol, fromTokenAddress } = route;
    const payload = { fromTokenSymbol, fromTokenAddress };

    if (!acc[fromChain]?.some((t) => t.fromTokenAddress === fromTokenAddress)) {
      acc[fromChain] = [...(acc[fromChain] ?? []), payload];
    }
    return acc;
  },
  {} as Record<number, TokenSymbolAddressType[]>
);

const availableSymbols = [
  ...new Set(getRoutes(ChainId.MAINNET).routes.map((r) => r.fromTokenSymbol)),
];

const calculateUsdBalances = async (account: string) => {
  const coingeckoPrices = await Promise.all(
    availableSymbols.flatMap((symbol) => {
      const mainnetAddress = getToken(symbol).mainnetAddress;
      return mainnetAddress
        ? getApiEndpoint().coingecko(mainnetAddress, "usd")
        : [];
    })
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
            fromChainId: Number(chainId),
            fromTokenSymbol,
            fromTokenAddress,
            balance: await getBalance(
              Number(chainId),
              account,
              fromTokenAddress
            ),
          })
        );
        if (
          ![CHAIN_IDs.ALEPH_ZERO, CHAIN_IDs.POLYGON].includes(Number(chainId))
        ) {
          const fn = async () => {
            return {
              fromChainId: Number(chainId),
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

  try {
    await Promise.all(
      balances.map(async ({ fromChainId, fromTokenSymbol, balance }) => {
        const token = getToken(fromTokenSymbol);
        return reportTokenBalance(fromChainId, balance, token.symbol);
      })
    );
  } catch (error) {
    console.error("Failed to track balances", error);
  }

  const totalBalance = balances.reduce((acc, { fromTokenSymbol, balance }) => {
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
  }, 0);

  return totalBalance;
};
