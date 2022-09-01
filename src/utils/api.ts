import axios from "axios";
import { BigNumber, ethers } from "ethers";
import { Fee } from "./bridge";
import { ChainId } from "./constants";

/**
 * A current list of API endpoints supported by this function
 */
export type APIEndpoint = "limits" | "suggested-fees";
type EndpointMethods = "get" | "post";

/**
 * Creates a call to the Across Serverless API to the specified endpoint
 * @param endpoint The endpoint to make an HTTP request to
 * @param payload The content of the information transmitted to the endpoint. Note: query params if this method is a GET and data body if this method is POST/PUT
 * @returns The JSON/text content of the API call
 */
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

/**
 * Creates an HTTP call to the `suggested-fees` API endpoint
 * @param amount The amount of fees to calculate
 * @param originToken The ERC20 token address from the origin chain
 * @param toChainid The destination chain number. The chain `amount` of `originToken` will be bridged to
 * @returns The result of the HTTP call to `api/suggested-fees`
 */
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

  const isAmountTooLow = result["isAmountTooLow"];

  return {
    relayerFee: {
      pct: relayFeePct,
      total: relayFeeTotal,
    },
    relayerCapitalFee: {
      pct: capitalFeePct,
      total: capitalFeeTotal,
    },
    relayerGasFee: {
      pct: relayGasFeePct,
      total: relayGasFeeTotal,
    },
    isAmountTooLow,
  };
}
