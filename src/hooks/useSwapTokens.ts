import { useQuery } from "@tanstack/react-query";
import getApiEndpoint from "utils/serverless-api";
import { SwapTokensQuery } from "utils/serverless-api/prod/swap-tokens";

export function useSwapTokens(query?: SwapTokensQuery) {
  return useQuery({
    queryKey: ["swapTokens", query],
    queryFn: async () => {
      const api = getApiEndpoint();
      return await api.swapTokens(query);
    },
  });
}
