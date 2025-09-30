import { useQuery } from "@tanstack/react-query";
import { getConfig } from "utils/config";
import { useSwapChains } from "./useSwapChains";
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

export default function useAvailableCrosschainRoutes() {
  const swapChainsQuery = useSwapChains();
  const swapTokensQuery = useSwapTokens();

  return useQuery({
    queryKey: ["availableCrosschainRoutes"],
    queryFn: async () => {
      // 1) Build swap token map by chain
      const swapTokensByChain = (swapTokensQuery.data || []).reduce(
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

      // 2) Build bridge token map by origin chain from generated routes
      const config = getConfig();
      const enabledRoutes = config.getEnabledRoutes();
      const bridgeOriginChains = Array.from(
        new Set(enabledRoutes.map((r) => r.fromChain))
      );

      const bridgeTokensByChain = bridgeOriginChains.reduce(
        (acc, fromChainId) => {
          const reachable = config.filterReachableTokens(fromChainId);
          const lifiTokens: LifiToken[] = reachable.map((t) => ({
            chainId: fromChainId,
            address: t.address,
            name: t.name,
            symbol: t.displaySymbol || t.symbol,
            decimals: t.decimals,
            logoURI: t.logoURI || "",
            // We do not have price data from the routes; default to 0
            priceUSD: "0",
            coinKey: t.symbol,
            routeSource: "bridge",
          }));
          acc[fromChainId] = lifiTokens;
          return acc;
        },
        {} as Record<number, Array<LifiToken>>
      );

      // 3) Combine swap and bridge tokens, deduplicating by address
      const chainIdsInSwap = new Set(
        (swapChainsQuery.data || []).map((c) => c.chainId)
      );
      const chainIdsInBridge = new Set(
        Object.keys(bridgeTokensByChain).map(Number)
      );
      const chainIds = Array.from(
        new Set([...chainIdsInSwap, ...chainIdsInBridge])
      );

      const combinedByChain: Record<number, Array<LifiToken>> = {};
      for (const chainId of chainIds) {
        const swapTokens = swapTokensByChain[chainId] || [];
        const bridgeTokens = bridgeTokensByChain[chainId] || [];

        // Deduplicate by address (case-insensitive), preferring swap tokens for price data
        const tokenMap = new Map<string, LifiToken>();

        // Add bridge tokens first
        bridgeTokens.forEach((token) => {
          tokenMap.set(token.address.toLowerCase(), token);
        });

        // Add swap tokens, overriding bridge tokens if same address (swap has price data)
        swapTokens.forEach((token) => {
          tokenMap.set(token.address.toLowerCase(), token);
        });

        combinedByChain[chainId] = Array.from(tokenMap.values());
      }

      return combinedByChain;
    },
    enabled: swapChainsQuery.isSuccess && swapTokensQuery.isSuccess,
  });
}
