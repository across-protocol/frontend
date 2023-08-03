import axios from "axios";

export type PoolsApiCall = typeof poolsApiCall;

export type PoolQueryData = {
  estimatedApy: string;
  exchangeRateCurrent: string;
};

export async function poolsApiCall(
  l1TokenOrExternalPoolToken: string,
  externalPoolProvider?: string
): Promise<PoolQueryData> {
  const response = await axios.get(`/api/pools`, {
    params: {
      token: l1TokenOrExternalPoolToken,
      externalPoolProvider,
    },
  });
  return response.data;
}
