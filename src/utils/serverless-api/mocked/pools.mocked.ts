import { PoolQueryData } from "../prod/pools";

export async function poolsApiCall(
  l1TokenOrExternalPoolToken: string,
  externalPoolProvider?: string
): Promise<PoolQueryData> {
  return {
    estimatedApy: "0.234",
    exchangeRateCurrent: "1000000000000000000",
    totalPoolSize: "1000000000000000000",
    liquidityUtilizationCurrent: "1000000000000000000",
  };
}
