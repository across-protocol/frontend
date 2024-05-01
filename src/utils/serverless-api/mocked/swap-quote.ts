import { BigNumber } from "ethers";
import {
  SwapQuoteApiResponse,
  SwapQuoteApiQueryParams,
} from "../prod/swap-quote";

export async function swapQuoteApiCall(
  params: SwapQuoteApiQueryParams
): Promise<SwapQuoteApiResponse> {
  return {
    minExpectedInputTokenAmount: BigNumber.from(params.swapTokenAmount),
    routerCalldata: "0x",
    value: "0",
    swapAndBridgeAddress: "0x",
    dex: "1inch",
    slippage: 0.1,
  };
}
