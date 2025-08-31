import { BigNumber } from "ethers";
import axios, { AxiosRequestHeaders } from "axios";

import {
  buildInternalCacheKey,
  makeCacheGetterAndSetter,
} from "../../../_cache";
import { Swap } from "../../types";
import { addMarkupToAmount } from "../../../_utils";
import {
  UPSTREAM_SWAP_PROVIDER_ERRORS,
  UpstreamSwapProviderError,
} from "../../../_errors";

// Cache TTL for 0x price quotes (60 seconds)
const PRICE_CACHE_TTL = 60;

/**
 * Creates a cached price quote for 0x API
 */
export function create0xPriceCache(
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: number,
  apiBaseUrl: string,
  apiHeaders: AxiosRequestHeaders,
  sourcesParams?: Record<string, string>
) {
  const cacheKey = buildInternalCacheKey(
    "0x-price",
    chainId,
    sellToken,
    buyToken,
    sellAmount,
    sourcesParams ? JSON.stringify(sourcesParams) : "default"
  );

  const fetchFn = async () => {
    const response = await axios.get(`${apiBaseUrl}/price`, {
      headers: apiHeaders,
      params: {
        chainId,
        sellToken,
        buyToken,
        sellAmount,
        taker,
        slippageBps,
        ...sourcesParams,
      },
    });
    return response.data;
  };

  return makeCacheGetterAndSetter(cacheKey, PRICE_CACHE_TTL, fetchFn);
}

/**
 * Estimate the input amount required for an exact output amount by using the
 * a single unit amount of the input token as a reference.
 */
export async function estimateInputForExactOutput(
  swap: Swap,
  apiBaseUrl: string,
  apiHeaders: AxiosRequestHeaders,
  swapProvider: string,
  sourcesParams?: Record<string, string>
): Promise<string> {
  const inputUnit = BigNumber.from(10).pow(swap.tokenIn.decimals);

  // Create cache for the unit price quote
  const unitPriceCache = create0xPriceCache(
    swap.chainId,
    swap.tokenIn.address,
    swap.tokenOut.address,
    inputUnit.toString(),
    swap.recipient,
    Math.floor(swap.slippageTolerance * 100),
    apiBaseUrl,
    apiHeaders,
    sourcesParams
  );

  const inputUnitQuote = await unitPriceCache.get();
  if (!inputUnitQuote.liquidityAvailable) {
    throw new UpstreamSwapProviderError({
      message: `${swapProvider}: No liquidity available for ${
        swap.tokenIn.symbol
      } -> ${swap.tokenOut.symbol} on chain ${swap.chainId}`,
      code: UPSTREAM_SWAP_PROVIDER_ERRORS.INSUFFICIENT_LIQUIDITY,
      swapProvider,
    });
  }

  const inputUnitOutputAmount = BigNumber.from(inputUnitQuote.buyAmount);

  // Estimate the required input amount for the desired output
  const desiredOutputAmount = BigNumber.from(swap.amount);
  const requiredInputAmount = desiredOutputAmount
    .mul(inputUnit)
    .div(inputUnitOutputAmount);

  // Consider slippage and add fixed buffer for price discrepancies between the input
  // unit and the desired output amount
  const buffer = 0.05; // 5%
  const adjustedInputAmount = addMarkupToAmount(
    requiredInputAmount,
    swap.slippageTolerance / 100 + buffer
  );
  return adjustedInputAmount.toString();
}
