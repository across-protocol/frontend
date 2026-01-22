import { useQuery } from "@tanstack/react-query";
import { useSwapTokens } from "./useSwapTokens";
import { swapTokenToTokenInfo } from "utils/token";
import cachedTokensData from "../data/swap-tokens.json";
import { SwapToken } from "utils/serverless-api/types";
import { TokenInfo } from "constants/tokens";

type SwapTokensCache = {
  tokens: SwapToken[];
  timestamp: number;
  version: string;
};

export type LifiToken = {
  chainId: number;
  address: string;
  symbol: string;
  displaySymbol?: string;
  name: string;
  decimals: number;
  priceUSD: string;
  coinKey: string;
  logoURI: string;
  routeSource: "bridge" | "swap";
};

export type RouteFilterParams = {
  inputToken?: { chainId: number; address: string; symbol: string } | null;
  outputToken?: { chainId: number; address: string; symbol: string } | null;
};

function buildTokensByChain(tokens: TokenInfo[]): Record<number, LifiToken[]> {
  return tokens.reduce(
    (acc, token) => {
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
          displaySymbol: token.displaySymbol,
          decimals: token.decimals,
          logoURI: token.logoURI || "",
          priceUSD: token.priceUsd || "0",
          coinKey: token.symbol,
          routeSource: "swap",
        };

        if (!acc[chainId]) {
          acc[chainId] = [];
        }
        acc[chainId].push(mapped);
      });

      return acc;
    },
    {} as Record<number, LifiToken[]>
  );
}

function getCachedTokensByChain(): Record<number, LifiToken[]> | undefined {
  try {
    const cache = cachedTokensData as SwapTokensCache;
    const tokenInfos = cache.tokens.map((token) => swapTokenToTokenInfo(token));
    return buildTokensByChain(tokenInfos);
  } catch (error) {
    console.warn("Failed to load cached crosschain routes:", error);
    return undefined;
  }
}

export default function useAvailableCrosschainRoutes(
  filterParams?: RouteFilterParams
) {
  const swapTokensQuery = useSwapTokens();

  return useQuery({
    queryKey: ["availableCrosschainRoutes", filterParams],
    queryFn: async () => {
      return buildTokensByChain(swapTokensQuery.data || []);
    },
    initialData: getCachedTokensByChain,
    enabled: swapTokensQuery.isSuccess,
  });
}

export function getTokenDisplaySymbol(token: LifiToken): string {
  return token.displaySymbol || token.symbol;
}
