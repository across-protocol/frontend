import { BigNumber, utils } from "ethers";
import { useConnection } from "hooks";
import { useEffect } from "react";
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

export function useWalletBalanceTrace() {
  const { account, isConnected } = useConnection();
  useEffect(() => {
    if (account && isConnected) {
      calculateUsdBalances(account).then((balance) => {
        reportTotalWalletUsdBalance(balance);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);
}

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
  const usdPrices: Record<string, BigNumber> = await availableSymbols.reduce(
    async (acc, symbol) => {
      const { price } = await getApiEndpoint().coingecko(
        getToken(symbol).mainnetAddress!,
        "usd"
      );
      return Promise.resolve({ ...(await acc), [symbol]: price });
    },
    Promise.resolve({})
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
              fromTokenSymbol: "WETH",
              fromTokenAddress: "0000000000000000000000000000000000000000",
              balance: await getNativeBalance(Number(chainId), account),
            };
          };
          promises.push(fn());
        }
        return await Promise.all(promises);
      })
    )
  ).flat(2);

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
