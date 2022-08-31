import axios from "axios";
import { ethers } from "ethers";
import { Fee } from "./bridge";
import { ChainId } from "./constants";
import { parseEther } from "./format";

export type APIEndpoint = "limits" | "suggested-fees";
type EndpointMethods = "get" | "post";

export async function apiCall(
  endpoint: APIEndpoint,
  payload: any
): Promise<any> {
  let method: EndpointMethods = "get";
  switch (endpoint) {
    case "limits":
    case "suggested-fees":
      method = "get";
      break;
  }
  const axiosConfig = {
    [method === "get" ? "params" : "data"]: payload,
  };
  const url = `/api/${endpoint}`;
  const response = await axios.get(url, axiosConfig);
  const data = response.data;

  return data;
}

export async function suggestedFeesApiCall(
  amount: ethers.BigNumber,
  originToken: string,
  toChainid: ChainId
): Promise<{
  relayerFee: Fee;
  relayerGasFee: Fee;
  relayerCapitalFee: Fee;
  isAmountTooLow: boolean;
}> {
  const result = await apiCall("suggested-fees", {
    token: originToken,
    destinationChainId: toChainid,
    amount: amount.toString(),
  });
  const relayFeePct = parseEther(result["relayFeePct"]);
  const lpFeePct = parseEther(result["lpFeePct"]);
  const relayerFee = relayFeePct.mul(amount);
  const lpFee = lpFeePct.mul(amount);

  return {
    relayerFee: {
      pct: relayFeePct,
      total: relayerFee,
    },
    relayerCapitalFee: {
      pct: lpFeePct,
      total: lpFee,
    },
    isAmountTooLow: false,
    relayerGasFee: {
      pct: relayFeePct,
      total: relayerFee,
    },
  };
}
