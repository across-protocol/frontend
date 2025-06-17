import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import axios from "axios";

import { getLogger } from "../../_utils";
import { QuoteFetchOpts, QuoteFetchStrategy, Swap, SwapQuote } from "../types";
import { getUniversalSwapAndBridgeAddress } from "../../_swap-and-bridge";
import { getSpokePoolAddress } from "../../_utils";
import { ALLOWANCE_HOLDER_ADDRESS } from "./utils/addresses";
import { getEnvs } from "../../_env";

const { API_KEY_0X } = getEnvs();

const API_BASE_URL = "https://api.0x.org/swap/allowance-holder";

const API_HEADERS = {
  "Content-Type": "application/json",
  "0x-api-key": `${API_KEY_0X}`,
  "0x-version": "v2",
};

export function get0xStrategy(): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    const address = ALLOWANCE_HOLDER_ADDRESS[chainId];
    if (!address) {
      throw new Error(
        `AllowanceHolder address not found for chain id ${chainId}`
      );
    }
    return {
      address,
      name: "AllowanceHolder",
    };
  };

  const getOriginEntryPoints = (chainId: number) => {
    return {
      swapAndBridge: {
        name: "UniversalSwapAndBridge",
        address: getUniversalSwapAndBridgeAddress("0x", chainId), // TODO: Add universal swap and bridge addresses for 0x
        dex: "0x",
      },
      deposit: {
        name: "SpokePool",
        address: getSpokePoolAddress(chainId),
      },
    } as const;
  };

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts?: QuoteFetchOpts
  ) => {
    if (tradeType !== TradeType.EXACT_INPUT) {
      throw new Error("Exact input is the only supported trade type for 0x");
    }

    const response = await axios.get(
      `${API_BASE_URL}/${opts?.useIndicativeQuote ? "price" : "quote"}`,
      {
        headers: API_HEADERS,
        params: {
          chainId: swap.chainId,
          sellToken: swap.tokenIn.address,
          buyToken: swap.tokenOut.address,
          sellAmount: swap.amount,
          taker: swap.recipient,
          slippageBps: Math.floor(swap.slippageTolerance * 100),
        },
      }
    );

    const quote = response.data;

    const expectedAmountIn = BigNumber.from(quote.sellAmount);
    const maximumAmountIn = expectedAmountIn;

    const expectedAmountOut = BigNumber.from(quote.buyAmount);
    const minAmountOut = BigNumber.from(quote.minBuyAmount);

    const swapTx = opts?.useIndicativeQuote
      ? {
          to: "0x0",
          data: "0x0",
          value: "0x0",
        }
      : {
          to: quote.transaction.to,
          data: quote.transaction.data,
          value: quote.transaction.value,
        };

    const swapQuote: SwapQuote = {
      tokenIn: swap.tokenIn,
      tokenOut: swap.tokenOut,
      maximumAmountIn,
      minAmountOut,
      expectedAmountOut,
      expectedAmountIn,
      slippageTolerance: swap.slippageTolerance,
      swapTxns: [swapTx],
    };

    getLogger().debug({
      at: "0x/fetchFn",
      message: "Swap quote",
      type: "EXACT_INPUT",
      tokenIn: swapQuote.tokenIn.symbol,
      tokenOut: swapQuote.tokenOut.symbol,
      chainId: swap.chainId,
      maximumAmountIn: swapQuote.maximumAmountIn.toString(),
      minAmountOut: swapQuote.minAmountOut.toString(),
      expectedAmountOut: swapQuote.expectedAmountOut.toString(),
      expectedAmountIn: swapQuote.expectedAmountIn.toString(),
    });

    return swapQuote;
  };

  return {
    getRouter,
    getOriginEntryPoints,
    fetchFn,
  };
}
