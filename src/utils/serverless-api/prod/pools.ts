import axios from "axios";
import { vercelApiBaseUrl } from "utils";

export type PoolsApiCall = typeof poolsApiCall;

export type PoolQueryData = {
  estimatedApy: string;
  exchangeRateCurrent: string;
  totalPoolSize: string;
  liquidityUtilizationCurrent: string;
};

export async function poolsApiCall(
  l1TokenOrExternalPoolToken: string,
  externalPoolProvider?: string
): Promise<PoolQueryData> {
  const response = await axios.get(`${vercelApiBaseUrl}/api/pools`, {
    params: {
      token: l1TokenOrExternalPoolToken,
      externalPoolProvider,
    },
  });
  return response.data;
}
