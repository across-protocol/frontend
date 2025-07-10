import axios from "axios";
import { vercelApiBaseUrl } from "utils";

export type OrderBookApiCall = typeof orderBookApiCall;

export type OrderBookApiResponse = {
  [relayer: string]: {
    amount: number;
    spread: number;
  }[];
};

export type OrderBookApiQueryParams = {
  originChainId: number;
  destinationChainId: number;
  inputToken: string;
  outputToken: string;
};

export async function orderBookApiCall(
  params: OrderBookApiQueryParams
): Promise<OrderBookApiResponse> {
  const response = await axios.get<OrderBookApiResponse>(
    `${vercelApiBaseUrl}/api/relayer/orderbook`,
    {
      params: {
        originChainId: params.originChainId,
        destinationChainId: params.destinationChainId,
        originToken: params.inputToken,
        destinationToken: params.outputToken,
      },
    }
  );
  console.log(response.data);
  return response.data;
  // return {
  //   orderBook: {
  //     "0x1234567890123456789012345678901234567890": [
  //       {
  //         amount: 100,
  //         spread: 0.01,
  //       },
  //       {
  //         amount: 200,
  //         spread: 0.02,
  //       },
  //     ],
  //     "0x4567890123456789012345678901234567890123": [
  //       {
  //         amount: 200,
  //         spread: 0.02,
  //       },
  //       {
  //         amount: 300,
  //         spread: 0.03,
  //       },
  //     ],
  //   },
  // };
}
