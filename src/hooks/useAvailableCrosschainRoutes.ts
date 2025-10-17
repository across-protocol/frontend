import { useQuery } from "@tanstack/react-query";
import { useSwapTokens } from "./useSwapTokens";

export type LifiToken = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUSD: string;
  coinKey: string;
  logoURI: string;
  routeSource: "bridge" | "swap";
};

export type TokenInfo = {
  chainId: number;
  address: string;
  symbol: string;
};

export type RouteFilterParams = {
  inputToken?: TokenInfo | null;
  outputToken?: TokenInfo | null;
};

export default function useAvailableCrosschainRoutes(
  filterParams?: RouteFilterParams
) {
  const swapTokensQuery = useSwapTokens();

  return useQuery({
    queryKey: ["availableCrosschainRoutes", filterParams],
    queryFn: async () => {
      // Build token map by chain from API tokens
      const tokensByChain = (swapTokensQuery.data || []).reduce(
        (acc, token) => {
          const mapped: LifiToken = {
            chainId: token.chainId,
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            logoURI: token.logoUrl || "",
            priceUSD: token.priceUsd || "0",
            coinKey: token.symbol,
            routeSource: "swap",
          };
          if (!acc[token.chainId]) {
            acc[token.chainId] = [];
          }
          acc[token.chainId].push(mapped);
          return acc;
        },
        {} as Record<number, Array<LifiToken>>
      );

      return tokensByChain;
    },
    enabled: swapTokensQuery.isSuccess,
  });
}
