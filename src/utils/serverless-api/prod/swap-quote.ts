import axios from "axios";
import { BigNumber } from "ethers";
import { vercelApiBaseUrl } from "utils";

export type SwapQuoteApiCall = typeof swapQuoteApiCall;

export type SupportedDex = "uniswap" | "1inch";

export type SwapQuoteApiResponse = {
  minExpectedInputTokenAmount: BigNumber;
  routerCalldata: string;
  value: string;
  swapAndBridgeAddress: string;
  dex: SupportedDex;
  slippage: number;
};

export type SwapQuoteApiQueryParams = {
  swapToken: string;
  acrossInputToken: string;
  acrossOutputToken: string;
  swapTokenAmount: string;
  originChainId: number;
  destinationChainId: number;
  swapSlippage: number;
};

export async function swapQuoteApiCall(
  params: SwapQuoteApiQueryParams
): Promise<SwapQuoteApiResponse> {
  const response = await axios.get<{}, { data: SwapQuoteApiResponse }>(
    `${vercelApiBaseUrl}/api/swap-quote`,
    {
      params,
    }
  );
  return {
    ...response.data,
    minExpectedInputTokenAmount: BigNumber.from(
      response.data.minExpectedInputTokenAmount
    ),
    slippage: Number(response.data.slippage),
  };
}
