import axios from "axios";
import { ChainId, vercelApiBaseUrl } from "utils";
import { BridgeLimitInterface } from "../types";

export async function retrieveLimits(
  token: string,
  fromChainId: string | ChainId,
  toChainId: string | ChainId
): Promise<BridgeLimitInterface> {
  const { data } = await axios.get<BridgeLimitInterface>(
    `${vercelApiBaseUrl}/api/limits?token=${token}&originChainId=${fromChainId}&destinationChainId=${toChainId}`
  );
  return data;
}
