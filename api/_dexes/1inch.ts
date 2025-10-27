import axios from "axios";

import { Swap, OriginSwapQuoteAndCalldata } from "./types";
import { getSwapAndBridgeAddress } from "../_swap-and-bridge";
import { getEnvs } from "../_env";
import { getSlippage } from "../_slippage";

const { ONEINCH_API_KEY } = getEnvs();

export async function get1inchQuoteForOriginSwapExactInput(
  swap: Omit<Swap, "recipient">
): Promise<OriginSwapQuoteAndCalldata> {
  const swapAndBridgeAddress = getSwapAndBridgeAddress("1inch", swap.chainId);
  const apiBaseUrl = `https://api.1inch.dev/swap/v6.0/${swap.chainId}`;
  const apiHeaders = {
    Authorization: `Bearer ${ONEINCH_API_KEY}`,
    accept: "application/json",
  };

  const slippageTolerance = getSlippage({
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    slippageTolerance: swap.slippageTolerance,
  });

  const swapParams = {
    src: swap.tokenIn.address,
    dst: swap.tokenOut.address,
    amount: swap.amount,
    from: swapAndBridgeAddress,
    slippage: slippageTolerance,
    disableEstimate: true,
    allowPartialFill: false,
    receiver: swapAndBridgeAddress,
  };

  const response = await axios.get<{
    // https://portal.1inch.dev/documentation/swap/swagger?method=get&path=%2Fv6.0%2F1%2Fswap
    toAmount?: string;
    dstAmount: string;
    tx: {
      data: string;
      value: string;
    };
  }>(`${apiBaseUrl}/swap`, {
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
    slippage: slippageTolerance,
  };
}
