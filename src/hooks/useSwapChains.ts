import { useQuery } from "@tanstack/react-query";
import getApiEndpoint from "utils/serverless-api";

export function useSwapChains() {
  return useQuery({
    queryKey: ["swapChains"],
    queryFn: async () => {
      const api = getApiEndpoint();
      return await api.swapChains();
    },
  });
}
