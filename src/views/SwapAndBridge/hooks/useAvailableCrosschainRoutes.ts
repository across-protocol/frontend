import { useQuery } from "@tanstack/react-query";
import { useSwapTokens } from "../../../hooks/useSwapTokens";

export type LifiToken = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUSD: string;
  coinKey: string;
  logoURI: string;
  routeSource: ("bridge" | "swap")[];
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
          // Get the chainId from the addresses record (TokenInfo has addresses object)
          const chainIds = token.addresses
            ? Object.keys(token.addresses).map(Number)
            : [];

          chainIds.forEach((chainId) => {
            const address = token.addresses?.[chainId];
            if (!address) return;

            const mapped: LifiToken = {
              chainId: chainId,
              address: address,
              name: token.name,
              symbol: token.symbol,
              decimals: token.decimals,
              logoURI: token.logoURI || "",
              priceUSD: token.priceUsd || "0", // Use price from SwapToken, fallback to "0" if not available
              coinKey: token.symbol,
              routeSource: ["swap"],
            };

            if (!acc[chainId]) {
              acc[chainId] = [];
            }
            acc[chainId].push(mapped);
          });

          return acc;
        },
        {} as Record<number, Array<LifiToken>>
      );

      return tokensByChain;
    },
    enabled: swapTokensQuery.isSuccess,
  });
}
