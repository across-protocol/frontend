import axios from "axios";
import { ChainId, vercelApiBaseUrl } from "utils";
import { BridgeLimitInterface } from "../types";

export async function retrieveLimits(
  inputToken: string,
  outputToken: string,
  fromChainId: string | ChainId,
  toChainId: string | ChainId
): Promise<BridgeLimitInterface> {
  const { data } = await axios.get<BridgeLimitInterface>(
    `${vercelApiBaseUrl}/api/limits`,
    {
      params: {
        inputToken,
        outputToken,
        originChainId: fromChainId,
        destinationChainId: toChainId,
      },
    }
  );
  return data;
}
