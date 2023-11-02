import { useQuery } from "react-query";
import getApiEndpoint from "utils/serverless-api";

export function useCoingeckoPrice(
  l1Token: string,
  baseCurrency: string,
  enabled: boolean = true
) {
  return useQuery(
    ["price", l1Token, baseCurrency],
    async () => getApiEndpoint().coingecko(l1Token, baseCurrency),
    {
      enabled,
    }
  );
}
