import { useMemo } from "react";
import useAvailableCrosschainRoutes, {
  LifiToken,
} from "./useAvailableCrosschainRoutes";
import useTokenBalancesOnChain from "./useTokenBalancesOnChain";
import { compareAddressesSimple } from "utils";
import { BigNumber, utils } from "ethers";

export default function useEnrichedCrosschainBalances() {
  const tokenBalances = useTokenBalancesOnChain();
  const availableCrosschainRoutes = useAvailableCrosschainRoutes();

  return useMemo(() => {
    if (availableCrosschainRoutes.isLoading || tokenBalances.isLoading) {
      return {};
    }
    const chains = Object.keys(availableCrosschainRoutes.data || {});

    return chains.reduce(
      (acc, chainId) => {
        const balancesForChain = tokenBalances.data?.find(
          (t) => t.chainId === Number(chainId)
        );

        const tokens = availableCrosschainRoutes.data![Number(chainId)];
        const enrichedTokens = tokens
          .map((t) => {
            const balance = balancesForChain?.balances.find((b) =>
              compareAddressesSimple(b.address, t.address)
            );
            return {
              ...t,
              balance: balance?.balance ?? BigNumber.from(0),
              balanceUsd:
                balance?.balance && t
                  ? Number(utils.formatUnits(balance.balance, t.decimals)) *
                    Number(t.priceUSD)
                  : 0,
            };
          })
          // Filter out tokens that don't have a logoURI
          .filter((t) => t.logoURI !== undefined);

        // Sort high to low balanceUsd
        const orderedEnrichedTokens = enrichedTokens.sort(
          (a, b) => b.balanceUsd - a.balanceUsd
        );

        return {
          ...acc,
          [Number(chainId)]: orderedEnrichedTokens,
        };
      },
      {} as Record<
        number,
        Array<LifiToken & { balance: BigNumber; balanceUsd: number }>
      >
    );
  }, [availableCrosschainRoutes, tokenBalances]);
}
