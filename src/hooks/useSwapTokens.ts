import { useQuery } from "@tanstack/react-query";
import getApiEndpoint from "utils/serverless-api";
import { swapTokenToTokenInfo } from "utils/token";
import { TokenInfo } from "constants/tokens";

// Import cached tokens data
import cachedTokensData from "../data/swap-tokens.json";
import { SwapToken } from "utils/serverless-api/types";
import { SwapTokensQuery } from "utils/serverless-api/prod/swap-tokens";

type SwapTokensCache = {
  tokens: SwapToken[];
  timestamp: number;
  version: string;
};

function filterTokensByChainId(
  tokens: SwapToken[],
  chainId?: number | number[]
): SwapToken[] {
  if (!chainId) {
    return tokens;
  }

  const chainIds = Array.isArray(chainId) ? chainId : [chainId];
  return tokens.filter((token) => chainIds.includes(token.chainId));
}

function convertSwapTokensToTokenInfo(tokens: SwapToken[]): TokenInfo[] {
  return tokens.map((token) => swapTokenToTokenInfo(token));
}

export function useSwapTokens(query?: SwapTokensQuery) {
  return useQuery<TokenInfo[]>({
    queryKey: ["swapTokens", query],
    queryFn: async () => {
      const api = getApiEndpoint();
      const tokens = await api.swapTokens(query);
      return convertSwapTokensToTokenInfo(tokens);
    },
    // Use cached data as initial data for immediate loading
    initialData: () => {
      try {
        const cache = cachedTokensData as SwapTokensCache;
        const filteredTokens = filterTokensByChainId(
          cache.tokens,
          query?.chainId
        );
        return convertSwapTokensToTokenInfo(filteredTokens);
      } catch (error) {
        console.warn("Failed to load cached swap tokens:", error);
        return undefined;
      }
    },
    refetchInterval: 60_000,
  });
}
