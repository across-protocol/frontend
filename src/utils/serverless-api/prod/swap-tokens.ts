import axios from "axios";
import { vercelApiBaseUrl } from "utils";
import { SwapToken } from "../types";

export type SwapTokensApiCall = typeof swapTokensApiCall;

export type SwapTokensQuery = {
  chainId?: number | number[];
};

export async function swapTokensApiCall(
  query?: SwapTokensQuery
): Promise<SwapToken[]> {
  const response = await axios.get<SwapToken[]>(
    `${vercelApiBaseUrl}/api/swap/tokens`,
    {
      params: query,
    }
  );
  return response.data;
}
