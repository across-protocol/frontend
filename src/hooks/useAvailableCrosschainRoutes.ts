import { MAINNET_CHAIN_IDs } from "@across-protocol/constants";
import { useQuery } from "@tanstack/react-query";
import getApiEndpoint from "utils/serverless-api";
import { SwapChain, SwapToken } from "utils/serverless-api/types";

export type LifiToken = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUSD: string;
  coinKey: string;
  logoURI: string;
};

// TODO: Currently stubbed and will need to be added to the swap API
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

      const tokenByChain = (tokens as SwapToken[]).reduce(
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
          };
          if (!acc[token.chainId]) {
            acc[token.chainId] = [];
          }
          acc[token.chainId].push(mapped);
          return acc;
        },
        {} as Record<number, Array<LifiToken>>
      );

      // Ensure chains with no tokens are present as empty arrays
      (chains as SwapChain[]).forEach((c) => {
        if (allowedChainIds.has(c.chainId) && !tokenByChain[c.chainId]) {
          tokenByChain[c.chainId] = [];
        }
      });

      return tokenByChain;
    },
  });
}
