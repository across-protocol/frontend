import axios from "axios";

import { AcrossSwap, SwapQuoteAndCalldata } from "./types";
import { getSwapAndBridgeAddress } from "./utils";

const config = {
  slippage: 1, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
};

export async function get1inchQuoteAndCalldata(
  swap: AcrossSwap
): Promise<SwapQuoteAndCalldata> {
  try {
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
      slippage: config.slippage,
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
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}
