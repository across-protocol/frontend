import { useMemo } from "react";
import useAvailableCrosschainRoutes, {
  LifiToken,
} from "./useAvailableCrosschainRoutes";
import { useUserTokenBalances } from "./useUserTokenBalances";
import { compareAddressesSimple } from "utils";
import { BigNumber, utils } from "ethers";

export function useEnrichedCrosschainBalances() {
  const tokenBalances = useUserTokenBalances();
  const availableCrosschainRoutes = useAvailableCrosschainRoutes();

  return useMemo(() => {
    if (availableCrosschainRoutes.isLoading || tokenBalances.isLoading) {
      return {};
    }
    const chains = Object.keys(availableCrosschainRoutes.data || {});

    return chains.reduce(
      (acc, chainId) => {
        const balancesForChain = tokenBalances.data?.balances.find(
          (t) => t.chainId === String(chainId)
        );

        const tokens = availableCrosschainRoutes.data![Number(chainId)];
        const enrichedTokens = tokens.map((t) => {
          const balance = balancesForChain?.balances.find((b) =>
            compareAddressesSimple(b.address, t.address)
          );
          return {
            ...t,
            balance: balance?.balance
              ? BigNumber.from(balance.balance)
              : BigNumber.from(0),
            balanceUsd:
              balance?.balance && t
                ? Number(
                    utils.formatUnits(
                      BigNumber.from(balance.balance),
                      t.decimals
                    )
                  ) * Number(t.priceUSD)
                : 0,
          };
        });

        // Sort high to low balanceUsd
        const sortedByBalance = enrichedTokens.sort(
          (a, b) => b.balanceUsd - a.balanceUsd
        );

        return {
          ...acc,
          [Number(chainId)]: sortedByBalance,
        };
      },
      {} as Record<
        number,
        Array<LifiToken & { balance: BigNumber; balanceUsd: number }>
      >
    );
  }, [
    availableCrosschainRoutes.data,
    availableCrosschainRoutes.isLoading,
    tokenBalances.data,
    tokenBalances.isLoading,
  ]);
}
