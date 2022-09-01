import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { Fee } from "./bridge";
import { ChainId } from "./constants";

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
    skipAmountLimit: true,
  });

  const relayFeePct = BigNumber.from(result["relayFeePct"]);
  const relayFeeTotal = BigNumber.from(result["relayFeeTotal"]);

  const capitalFeePct = BigNumber.from(result["capitalFeePct"]);
  const capitalFeeTotal = BigNumber.from(result["capitalFeeTotal"]);

  const relayGasFeePct = BigNumber.from(result["relayGasFeePct"]);
  const relayGasFeeTotal = BigNumber.from(result["relayGasFeeTotal"]);

  return {
    relayerFee: {
      pct: relayFeePct,
      total: relayFeeTotal,
    },
    relayerCapitalFee: {
      pct: capitalFeePct,
      total: capitalFeeTotal,
    },
    isAmountTooLow: false,
    relayerGasFee: {
      pct: relayGasFeePct,
      total: relayGasFeeTotal,
    },
  };
}
