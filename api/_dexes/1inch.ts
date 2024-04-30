import axios from "axios";

import { AcrossSwap, SwapQuoteAndCalldata } from "./types";
import { getSwapAndBridgeAddress } from "./utils";

export async function get1inchQuoteAndCalldata(
  swap: AcrossSwap
): Promise<SwapQuoteAndCalldata> {
  const swapAndBridgeAddress = getSwapAndBridgeAddress(
    "1inch",
    swap.swapToken.chainId
  );
  const apiBaseUrl = `https://api.1inch.dev/swap/v6.0/${swap.swapToken.chainId}`;
  const apiHeaders = {
    Authorization: `Bearer ${process.env.ONEINCH_API_KEY}`,
    accept: "application/json",
  };

  const swapParams = {
    src: swap.swapToken.address,
    dst: swap.acrossInputToken.address,
    amount: swap.swapTokenAmount,
    from: swapAndBridgeAddress,
    slippage: swap.slippage,
    disableEstimate: true,
    allowPartialFill: false,
    receiver: swapAndBridgeAddress,
  };

  const response = await axios.get(`${apiBaseUrl}/swap`, {
    headers: apiHeaders,
    params: swapParams,
  });

  return {
    minExpectedInputTokenAmount:
      response.data.toAmount || response.data.dstAmount,
    routerCalldata: response.data.tx.data,
    value: response.data.tx.value,
    swapAndBridgeAddress,
    dex: "1inch",
    slippage: swap.slippage,
  };
}
