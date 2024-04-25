import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string } from "superstruct";
import { ethers } from "ethers";

import { TypedVercelRequest } from "./_types";
import {
  InputError,
  getLogger,
  getTokenByAddress,
  handleErrorCondition,
  positiveIntStr,
  validAddress,
} from "./_utils";
import { getUniswapQuoteAndCalldata } from "./_dexes/uniswap";
import { get1inchQuoteAndCalldata } from "./_dexes/1inch";

const SwapQuoteQueryParamsSchema = type({
  depositor: validAddress(),
  swapToken: validAddress(),
  acrossInputToken: validAddress(),
  swapTokenAmount: string(),
  originChainId: positiveIntStr(),
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
      depositor,
      swapToken: swapTokenAddress,
      acrossInputToken: acrossInputTokenAddress,
      swapTokenAmount,
      originChainId: _originChainId,
    } = query;

    swapTokenAddress = ethers.utils.getAddress(swapTokenAddress);
    acrossInputTokenAddress = ethers.utils.getAddress(acrossInputTokenAddress);
    const originChainId = parseInt(_originChainId);

    const _swapToken = getTokenByAddress(swapTokenAddress, originChainId);
    const _acrossInputToken = getTokenByAddress(
      acrossInputTokenAddress,
      originChainId
    );

    if (!_swapToken || !_acrossInputToken) {
      throw new InputError(
        `Unsupported ${
          !_swapToken ? "swap" : "input"
        } token on chain ${originChainId}`
      );
    }

    const swapToken = {
      address: swapTokenAddress,
      decimals: _swapToken.decimals,
      symbol: _swapToken.symbol,
      chainId: originChainId,
    };
    const acrossInputToken = {
      address: acrossInputTokenAddress,
      decimals: _acrossInputToken.decimals,
      symbol: _acrossInputToken.symbol,
      chainId: originChainId,
    };

    // TODO: add retry and timeout logic?
    const quoteResults = await Promise.allSettled([
      getUniswapQuoteAndCalldata({
        depositor,
        swapToken,
        acrossInputToken,
        swapTokenAmount,
      }),
      get1inchQuoteAndCalldata({
        depositor,
        swapToken,
        acrossInputToken,
        swapTokenAmount,
      }),
    ]);

    const settledResults = quoteResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    console.log(settledResults);

    if (settledResults.length === 0) {
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
