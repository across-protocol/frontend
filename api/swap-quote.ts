import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string, optional } from "superstruct";
import { ethers } from "ethers";

import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  getTokenByAddress,
  handleErrorCondition,
  positiveFloatStr,
  positiveIntStr,
  validAddress,
  validateChainAndTokenParams,
  isSwapRouteEnabled,
} from "./_utils";
import { getUniswapQuoteWithSwapQuoter } from "./_dexes/uniswap/swap-quoter";
import { get1inchQuoteForOriginSwapExactInput } from "./_dexes/1inch";
import { InvalidParamError } from "./_errors";
import { AMOUNT_TYPE } from "./_dexes/utils";

const SwapQuoteQueryParamsSchema = type({
  swapToken: validAddress(),
  acrossInputToken: validAddress(),
  acrossOutputToken: validAddress(),
  swapTokenAmount: string(),
  originChainId: positiveIntStr(),
  destinationChainId: positiveIntStr(),
  swapSlippage: optional(positiveFloatStr(50)), // max. 50% slippage
});

type SwapQuoteQueryParams = Infer<typeof SwapQuoteQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<SwapQuoteQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "SwapQuote",
    message: "Query data",
    query,
  });
  try {
    assert(query, SwapQuoteQueryParamsSchema);

    let {
      swapToken: swapTokenAddress,
      acrossInputToken: acrossInputTokenAddress,
      acrossOutputToken: acrossOutputTokenAddress,
      swapTokenAmount,
      originChainId: _originChainId,
      destinationChainId: _destinationChainId,
      swapSlippage = "0.5", // Default to 0.5% slippage
    } = query;

    const {
      inputToken: acrossInputToken,
      outputToken: acrossOutputToken,
      destinationChainId,
      resolvedOriginChainId: originChainId,
    } = validateChainAndTokenParams({
      inputToken: acrossInputTokenAddress,
      outputToken: acrossOutputTokenAddress,
      originChainId: _originChainId,
      destinationChainId: _destinationChainId,
      allowUnmatchedDecimals: "true",
    });

    swapTokenAddress = ethers.utils.getAddress(swapTokenAddress);
    const _swapToken = getTokenByAddress(swapTokenAddress, originChainId);

    if (!_swapToken) {
      throw new InvalidParamError({
        message: `Unsupported swap token ${swapTokenAddress} on chain ${originChainId}`,
      });
    }

    const swapToken = {
      address: swapTokenAddress,
      decimals: _swapToken.decimals,
      symbol: _swapToken.symbol,
      chainId: originChainId,
    };

    // Only allow whitelisted swap routes. Can be viewed in the
    // `src/data/routes_*.json` files under the `swapRoutes` key.
    if (
      !isSwapRouteEnabled({
        originChainId,
        destinationChainId,
        acrossInputTokenSymbol: acrossInputToken.symbol,
        acrossOutputTokenSymbol: acrossOutputToken.symbol,
        swapTokenAddress,
      })
    ) {
      throw new InvalidParamError({
        message: `Unsupported swap route`,
      });
    }

    const swap = {
      chainId: originChainId,
      tokenIn: swapToken,
      tokenOut: {
        ...acrossInputToken,
        chainId: originChainId,
      },
      amount: swapTokenAmount,
      slippageTolerance: parseFloat(swapSlippage),
      type: AMOUNT_TYPE.EXACT_INPUT,
    } as const;

    const quoteResults = await Promise.allSettled([
      getUniswapQuoteWithSwapQuoter(swap),
      get1inchQuoteForOriginSwapExactInput(swap),
    ]);

    const settledResults = quoteResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );
    const rejectedResults = quoteResults.flatMap((result) =>
      result.status === "rejected" ? result.reason : []
    );

    if (settledResults.length === 0) {
      rejectedResults.forEach((error) => logger.error(error));
      throw new Error("No quote results available");
    }

    const bestQuote = settledResults.reduce((best, current) => {
      if (
        ethers.BigNumber.from(current.minExpectedInputTokenAmount).gt(
          best.minExpectedInputTokenAmount
        )
      ) {
        return current;
      }
      return best;
    });

    logger.debug({
      at: "SwapQuote",
      message: "Response data",
      responseJson: bestQuote,
    });
    response.setHeader(
      "Cache-Control",
      "s-maxage=150, stale-while-revalidate=150"
    );
    response.status(200).json(bestQuote);
  } catch (error: unknown) {
    return handleErrorCondition("swap-quote", response, logger, error);
  }
};

export default handler;
