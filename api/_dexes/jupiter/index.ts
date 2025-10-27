import { AxiosError } from "axios";
import { BigNumber } from "ethers";
import { utils } from "@across-protocol/sdk";
import { address } from "@solana/kit";
import { TradeType } from "@uniswap/sdk-core";

import { getLogger } from "../../_utils";
import { QuoteFetchOpts, QuoteFetchStrategy, Swap } from "../types";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";
import {
  compactAxiosError,
  UPSTREAM_SWAP_PROVIDER_ERRORS,
  UpstreamSwapProviderError,
} from "../../_errors";
import { SOURCES } from "./utils/sources";
import { getJupiterQuote, getJupiterSwapInstructions } from "./utils/api";
import { getSlippage } from "../../_slippage";

const SWAP_PROVIDER_NAME = "jupiter";
// From https://dev.jup.ag/docs/old/additional-topics/links-and-contract-addresses
const JUPITER_ROUTER_ADDRESS = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

const getSources = makeGetSources(SOURCES);

export function getJupiterStrategy(): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    if (!utils.chainIsSvm(chainId)) {
      throw new Error(`Jupiter not supported for chain id ${chainId}`);
    }
    return {
      address: JUPITER_ROUTER_ADDRESS,
      name: "JupiterRouter",
    };
  };

  const getOriginEntryPoints = (chainId: number) =>
    getOriginSwapEntryPoints("SvmSpoke", chainId, SWAP_PROVIDER_NAME);

  const assertSellEntireBalanceSupported = () => {
    throw new UpstreamSwapProviderError({
      message: "Option 'sellEntireBalance' is not supported by Jupiter",
      code: UPSTREAM_SWAP_PROVIDER_ERRORS.SELL_ENTIRE_BALANCE_UNSUPPORTED,
      swapProvider: SWAP_PROVIDER_NAME,
    });
  };

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts?: QuoteFetchOpts
  ) => {
    try {
      if (
        opts?.sellEntireBalance &&
        opts?.throwIfSellEntireBalanceUnsupported
      ) {
        assertSellEntireBalanceSupported();
      }

      const slippageTolerance = getSlippage({
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        slippageTolerance: swap.slippageTolerance,
      });

      const sources = opts?.sources;
      const sourcesParams =
        sources?.sourcesType === "exclude"
          ? {
              excludeDexes: sources.sourcesKeys.join(","),
            }
          : sources?.sourcesType === "include" &&
              sources.sourcesKeys?.length > 0
            ? {
                dexes: sources.sourcesKeys.join(","),
              }
            : {};

      const quoteParams = {
        inputMint: swap.tokenIn.address,
        outputMint: swap.tokenOut.address,
        amount: swap.amount,
        slippageBps: Math.round(slippageTolerance * 100), // From percentage to bps, needs to be an integer
        swapMode: tradeType === TradeType.EXACT_INPUT ? "ExactIn" : "ExactOut",
        ...sourcesParams,
        // @dev: We can use the following parameters if we face any limitations when building the transaction
        restrictIntermediateTokens: true,
        onlyDirectRoutes: true,
        // maxAccounts: 64,
      };

      const quote = await getJupiterQuote(quoteParams);

      const instructions = await getJupiterSwapInstructions(
        quote,
        swap.recipient
      );

      const swapTxns = [
        {
          ecosystem: "svm" as const,
          to: JUPITER_ROUTER_ADDRESS,
          instructions, // Jupiter swap instructions
          lookupTables: instructions.addressLookupTableAddresses.map((addr) =>
            address(addr)
          ),
        },
      ];

      const swapQuote = {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        maximumAmountIn: BigNumber.from(quote.inAmount),
        // Note: when using exact output, otherAmountThreshold is expressed in inputToken
        minAmountOut: BigNumber.from(
          tradeType === TradeType.EXACT_OUTPUT
            ? quote.outAmount
            : quote.otherAmountThreshold
        ),
        expectedAmountOut: BigNumber.from(quote.outAmount),
        expectedAmountIn: BigNumber.from(quote.inAmount),
        slippageTolerance: quote.slippageBps / 100, // Convert back to percentage
        swapTxns,
        swapProvider: {
          name: SWAP_PROVIDER_NAME,
          sources:
            quote.routePlan?.map((route: any) => route.swapInfo.label) || [],
        },
      };

      getLogger().debug({
        at: `${SWAP_PROVIDER_NAME}/fetchFn`,
        message: "Swap quote",
        type:
          tradeType === TradeType.EXACT_INPUT ? "EXACT_INPUT" : "EXACT_OUTPUT",
        tokenIn: swapQuote.tokenIn.symbol,
        tokenOut: swapQuote.tokenOut.symbol,
        chainId: swap.chainId,
        maximumAmountIn: swapQuote.maximumAmountIn.toString(),
        minAmountOut: swapQuote.minAmountOut.toString(),
        expectedAmountOut: swapQuote.expectedAmountOut.toString(),
        expectedAmountIn: swapQuote.expectedAmountIn.toString(),
      });

      return swapQuote;
    } catch (error) {
      getLogger().debug({
        at: `${SWAP_PROVIDER_NAME}/fetchFn`,
        message: "Error fetching Jupiter quote",
        error: compactAxiosError(error as Error),
      });
      throw parseJupiterError(error);
    }
  };

  return {
    strategyName: SWAP_PROVIDER_NAME,
    getRouter,
    getOriginEntryPoints,
    getSources,
    fetchFn,
    assertSellEntireBalanceSupported,
  };
}

// https://dev.jup.ag/docs/swap-api/common-errors
export function parseJupiterError(error: unknown) {
  if (error instanceof UpstreamSwapProviderError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const compactedError = compactAxiosError(error);

    if (!error.response?.data) {
      return new UpstreamSwapProviderError(
        {
          message: "Unknown error",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
      );
    }

    const { data, status } = error.response;
    const errorCode = data.errorCode || data.error;

    // Jupiter routing errors that indicate no route found
    if (
      [
        "NO_ROUTES_FOUND",
        "COULD_NOT_FIND_ANY_ROUTE",
        "ROUTE_PLAN_DOES_NOT_CONSUME_ALL_THE_AMOUNT",
        "MARKET_NOT_FOUND",
        "TOKEN_NOT_TRADABLE",
        "CIRCULAR_ARBITRAGE_IS_DISABLED",
      ].includes(errorCode)
    ) {
      return new UpstreamSwapProviderError(
        {
          message: data.error || "No route found",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.NO_POSSIBLE_ROUTE,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
      );
    }

    // Jupiter program errors that indicate slippage/tolerance issues
    if (
      [
        6001, // SlippageToleranceExceeded
        6017, // ExactOutAmountNotMatched
      ].includes(data.code) ||
      errorCode === "CANNOT_COMPUTE_OTHER_AMOUNT_THRESHOLD"
    ) {
      return new UpstreamSwapProviderError(
        {
          message: "Slippage tolerance exceeded or amount calculation failed",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.SLIPPAGE_TOLERANCE_EXCEEDED,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
      );
    }

    // Jupiter transaction composition errors
    if (
      [
        "MAX_ACCOUNT_GREATER_THAN_MAX",
        "INVALID_COMPUTE_UNIT_PRICE_AND_PRIORITIZATION_FEE",
        "FAILED_TO_GET_SWAP_AND_ACCOUNT_METAS",
      ].includes(errorCode) ||
      [6008, 6014].includes(data.code) // NotEnoughAccountKeys, IncorrectTokenProgramID
    ) {
      return new UpstreamSwapProviderError(
        {
          message: "Transaction composition failed",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.TRANSACTION_BUILD_FAILED,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
      );
    }

    // Generic unsupported operation
    if (errorCode === "NOT_SUPPORTED") {
      return new UpstreamSwapProviderError(
        {
          message: "Operation not supported",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNSUPPORTED_OPERATION,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
      );
    }

    // Server errors
    if (status >= 500) {
      return new UpstreamSwapProviderError(
        {
          message: "Service unavailable",
          code: UPSTREAM_SWAP_PROVIDER_ERRORS.SERVICE_UNAVAILABLE,
          swapProvider: SWAP_PROVIDER_NAME,
        },
        { cause: compactedError }
      );
    }

    return new UpstreamSwapProviderError(
      {
        message: data.error || "Unknown error",
        code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR,
        swapProvider: SWAP_PROVIDER_NAME,
      },
      { cause: compactedError }
    );
  }

  return new UpstreamSwapProviderError(
    {
      message: "Unknown error",
      code: UPSTREAM_SWAP_PROVIDER_ERRORS.UNKNOWN_ERROR,
      swapProvider: SWAP_PROVIDER_NAME,
    },
    { cause: error }
  );
}
