import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { Fee } from "./bridge";
import { ChainId } from "./constants";
import { parseUnits } from "./format";

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

  const relayFeePct = BigNumber.from(result["relayFeePct"]);
  const relayFeeTotal = amount.mul(relayFeePct).div(parseUnits("1", 18));

  const capitalFeePct = BigNumber.from(result["capitalFeePct"]);
  const capitalFeeTotal = amount.mul(capitalFeePct).div(parseUnits("1", 18));

  const relayGasFeePct = BigNumber.from(result["relayGasFeePct"]);
  const relayGasFeeTotal = amount.mul(relayGasFeePct).div(parseUnits("1", 18));

  console.log(relayGasFeePct.toString());
  console.log(relayGasFeeTotal.toString());

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
