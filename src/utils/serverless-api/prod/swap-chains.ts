import axios from "axios";
import { vercelApiBaseUrl } from "../../constants";
import { SwapChain } from "../types";

export type SwapChainsApiCall = typeof swapChainsApiCall;

export async function swapChainsApiCall(): Promise<SwapChain[]> {
  const response = await axios.get<SwapChain[]>(
    `${vercelApiBaseUrl}/api/swap/chains`
  );
  return response.data;
}
