import { MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import { useQuery } from "@tanstack/react-query";
import getApiEndpoint from "utils/serverless-api";
import { SwapChain, SwapToken } from "utils/serverless-api/types";
import { getConfig } from "utils/config";

export type LifiToken = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUSD: string;
  coinKey: string;
  logoURI: string;
  routeSource: "bridge" | "swap" | "both";
};

export default function useAvailableCrosschainRoutes() {
  return useQuery({
    queryKey: ["availableCrosschainRoutes"],
    queryFn: async () => {
      const api = getApiEndpoint();
      const [chains, tokens] = await Promise.all([
        api.swapChains(),
        api.swapTokens(),
      ]);

      const allowedChainIds = new Set<number>(Object.values(MAINNET_CHAIN_IDs));

      // 1) Build swap token map by chain
      const swapTokensByChain = (tokens as SwapToken[]).reduce(
        (acc, token) => {
          if (!allowedChainIds.has(token.chainId)) {
            return acc;
          }
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
          if (!allowedChainIds.has(fromChainId)) {
            return acc;
          }
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

      // 3) Merge swap and bridge tokens, de-duplicating by address (case-insensitive)
      const chainIdsInSwap = new Set(
        (chains as SwapChain[]).map((c) => c.chainId)
      );
      const chainIdsInBridge = new Set(
        Object.keys(bridgeTokensByChain).map(Number)
      );
      const chainIds = Array.from(
        new Set([...chainIdsInSwap, ...chainIdsInBridge])
      ).filter((id) => allowedChainIds.has(id));

      const blendedByChain: Record<number, Array<LifiToken>> = {};
      for (const chainId of chainIds) {
        const mapByAddr = new Map<string, LifiToken>();
        // Prefer swap tokens first (they include price)
        (swapTokensByChain[chainId] || []).forEach((t) => {
          mapByAddr.set(t.address.toLowerCase(), t);
        });
        // Add bridge tokens, merging routeSource when duplicate
        (bridgeTokensByChain[chainId] || []).forEach((t) => {
          const key = t.address.toLowerCase();
          const existing = mapByAddr.get(key);
          if (!existing) {
            mapByAddr.set(key, t);
          } else {
            // Merge: if token exists from swap, mark as both
            mapByAddr.set(key, { ...existing, routeSource: "both" });
          }
        });

        blendedByChain[chainId] = Array.from(mapByAddr.values());
      }

      return blendedByChain;
    },
  });
}
