import { useQuery } from "@tanstack/react-query";
import getApiEndpoint from "utils/serverless-api";

export function useCoingeckoPrice(
  l1Token: string,
  baseCurrency: string,
  historicalDateISO?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["price", historicalDateISO ?? "current", l1Token, baseCurrency],
    queryFn: async () =>
      getApiEndpoint().coingecko(l1Token, baseCurrency, historicalDateISO),
    enabled,
  });
}
