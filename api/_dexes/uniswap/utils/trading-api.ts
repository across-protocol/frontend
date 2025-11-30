import { TradeType } from "@uniswap/sdk-core";
import axios from "axios";

import { Swap } from "../../types";
import { V2PoolInRoute, V3PoolInRoute } from "./adapter";
import { getMulticall3Address } from "../../../_utils";
import { CHAIN_IDs } from "../../../_constants";
import { getSlippage } from "../../../_slippage";

export type UniswapClassicQuoteFromApi = {
  chainId: number;
  input: {
    amount: string;
    token: string;
  };
  output: {
    amount: string;
    token: string;
    recipient: string;
  };
  swapper: string;
  route: Array<(V3PoolInRoute | V2PoolInRoute)[]>;
  slippage: number;
  tradeType: "EXACT_OUTPUT" | "EXACT_INPUT";
  quoteId: string;
};

export type UniswapParamForApi = Omit<Swap, "type" | "slippageTolerance"> & {
  swapper: string;
  slippageTolerance?: number | "auto";
  protocols?: ("V2" | "V3" | "V4")[];
};

export const UNISWAP_TRADING_API_BASE_URL =
  process.env.UNISWAP_TRADING_API_BASE_URL ||
  "https://trade-api.gateway.uniswap.org/v1";

export const UNISWAP_API_KEY =
  process.env.UNISWAP_API_KEY || "JoyCGj29tT4pymvhaGciK4r1aIPvqW6W53xT1fwo";

/**
 * Based on https://api-docs.uniswap.org/api-reference/swapping/quote
 */
export async function getUniswapClassicQuoteFromApi(
  swap: UniswapParamForApi,
  tradeType: TradeType,
  opts?: {
    splitSlippage?: boolean;
  }
) {
  // NOTE: Temporary fix Stablecoin Mainnet -> Lens. The Multicall3 address is currently blocked
  // by the Uniswap API. We use a dummy address for just fetching the quote.
  // TODO: Remove this once the Uniswap API is updated.
  const shouldUseDummySwapper =
    swap.tokenIn.chainId === CHAIN_IDs.MAINNET &&
    swap.swapper === getMulticall3Address(swap.tokenIn.chainId);
  const dummySwapperAddress = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

  // Uniswap API supports auto slippage via the `autoSlippage` parameter. Therefore, we
  // don't need to resolve the slippage via our own logic.
  const slippageParams =
    swap.slippageTolerance === undefined || swap.slippageTolerance === "auto"
      ? {
          // https://api-docs.uniswap.org/api-reference/swapping/quote#body-slippage-tolerance
          autoSlippage: "DEFAULT",
        }
      : {
          slippageTolerance: getSlippage({
            tokenIn: swap.tokenIn,
            tokenOut: swap.tokenOut,
            slippageTolerance: swap.slippageTolerance,
            originOrDestination: swap.originOrDestination,
            splitSlippage: opts?.splitSlippage,
          }),
        };

  const response = await axios.post<{
    requestId: string;
    routing: "CLASSIC";
    quote: UniswapClassicQuoteFromApi;
  }>(
    `${UNISWAP_TRADING_API_BASE_URL}/quote`,
    {
      type:
        tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
      tokenInChainId: swap.tokenIn.chainId,
      tokenOutChainId: swap.tokenOut.chainId,
      tokenIn: swap.tokenIn.address,
      tokenOut: swap.tokenOut.address,
      swapper: shouldUseDummySwapper ? dummySwapperAddress : swap.swapper,
      amount: swap.amount,
      urgency: "urgent",
      protocols: swap.protocols || ["V2", "V3", "V4"],
      routingPreference: "BEST_PRICE",
      hooksOptions: "V4_NO_HOOKS",
      ...slippageParams,
    },
    {
      headers: {
        "x-api-key": UNISWAP_API_KEY,
        "x-universal-router-version": "2.0",
      },
    }
  );
  const { quote } = response.data;
  return {
    ...response.data,
    quote: {
      ...quote,
      output: {
        ...quote.output,
        // Revert the dummy recipient address to the original recipient address.
        recipient: shouldUseDummySwapper
          ? swap.recipient
          : quote.output.recipient,
      },
      // Revert the dummy swapper address to the original swapper address.
      swapper: shouldUseDummySwapper ? swap.swapper : quote.swapper,
    },
  };
}
