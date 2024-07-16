import { useQuery } from "react-query";
import getApiEndpoint from "utils/serverless-api";

export function useCoingeckoPrice(
  l1Token: string,
  baseCurrency: string,
  date?: string,
  enabled: boolean = true
) {
  return useQuery(
    ["price", date ?? "current", l1Token, baseCurrency],
    async () => getApiEndpoint().coingecko(l1Token, baseCurrency, date),
    {
      enabled,
    }
  );
}
