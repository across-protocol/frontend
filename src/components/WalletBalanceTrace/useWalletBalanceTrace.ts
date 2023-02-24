import { BigNumber, utils } from "ethers";
import { useConnection } from "hooks";
import { useEffect, useState } from "react";
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

export function useWalletBalanceTrace() {
  const { account, isConnected } = useConnection();
  const [recordingSuccessful, setRecordingSuccessful] = useState(false);

  // While setRecordingSuccessful is false, attempt to record the wallet balance every 30 seconds
  useEffect(() => {
    const interval =
      account && isConnected && !recordingSuccessful
        ? setInterval(() => {
            calculateUsdBalances(account)
              .then((balance) => {
                reportTotalWalletUsdBalance(balance);
                setRecordingSuccessful(true);
              })
              .catch((e) => {
                console.error("Failed to fetch balances:", e);
                Sentry.captureException(e);
              });
          }, 30000)
        : undefined;
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, recordingSuccessful]);

  // Reset the recordingSuccessful state whenever the account changes
  useEffect(() => {
    setRecordingSuccessful(false);
  }, [account]);

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
