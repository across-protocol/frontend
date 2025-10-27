import { BigNumber } from "ethers";
import { TradeType } from "@uniswap/sdk-core";
import { SwapRouter } from "@uniswap/universal-router-sdk";

import { getLogger, addMarkupToAmount } from "../../_utils";
import { QuoteFetchOpts, QuoteFetchStrategy, Swap } from "../types";
import {
  getUniswapClassicQuoteFromApi,
  UniswapClassicQuoteFromApi,
} from "./utils/trading-api";
import { floatToPercent } from "./utils/conversion";
import { RouterTradeAdapter } from "./utils/adapter";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";
import { parseUniswapError } from "./swap-router-02";
import { compactAxiosError } from "../../_errors";
import { UNIVERSAL_ROUTER_02_ADDRESS } from "./utils/addresses";
import { TransferType } from "../../_spoke-pool-periphery";
import { SOURCES } from "./utils/sources";
import { getSlippage } from "../../_slippage";

const STRATEGY_NAME = "uniswap/universal-router-02";

const getSources = makeGetSources(SOURCES);

export function getUniversalRouter02Strategy(): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    const address = UNIVERSAL_ROUTER_02_ADDRESS[chainId];
    if (!address) {
      throw new Error(
        `UniswapUniversalRouter02 address not found for chain id ${chainId}`
      );
    }
    return {
      address,
      name: "UniswapUniversalRouter02",
      transferType: TransferType.Transfer,
    };
  };

  const getOriginEntryPoints = (chainId: number) =>
    getOriginSwapEntryPoints("SpokePoolPeriphery", chainId, STRATEGY_NAME);

  const assertSellEntireBalanceSupported = () => {
    return true;
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

      const classicProtocols = ["V2", "V3", "V4"];
      const protocols =
        opts?.sources?.sourcesType === "exclude"
          ? classicProtocols.filter(
              (protocol) => !opts.sources?.sourcesKeys.includes(protocol)
            )
          : opts?.sources?.sourcesType === "include" &&
              opts.sources?.sourcesKeys?.length > 0
            ? classicProtocols.filter((protocol) =>
                opts.sources?.sourcesKeys.includes(protocol)
              )
            : classicProtocols;

      const { quote } = await getUniswapClassicQuoteFromApi(
        {
          ...swap,
          swapper: swap.recipient,
          protocols: protocols as ("V2" | "V3" | "V4")[],
        },
        tradeType
      );
      const swapTx = buildUniversalRouterSwapTx(swap, tradeType, quote);

      const expectedAmountIn = BigNumber.from(quote.input.amount);
      const maxAmountIn =
        tradeType === TradeType.EXACT_INPUT
          ? expectedAmountIn
          : addMarkupToAmount(expectedAmountIn, quote.slippage / 100);
      const expectedAmountOut = BigNumber.from(quote.output.amount);
      const minAmountOut =
        tradeType === TradeType.EXACT_OUTPUT
          ? expectedAmountOut
          : addMarkupToAmount(expectedAmountOut, -quote.slippage / 100);

      const swapQuote = {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        maximumAmountIn: maxAmountIn,
        minAmountOut,
        expectedAmountOut,
        expectedAmountIn,
        slippageTolerance: quote.slippage,
        swapTxns: [swapTx],
        swapProvider: {
          name: STRATEGY_NAME,
          sources: [SOURCES.strategy],
        },
      };

      getLogger().debug({
        at: `${STRATEGY_NAME}/fetchFn`,
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
        slippage: `${swapQuote.slippageTolerance}%`,
      });

      return swapQuote;
    } catch (error) {
      getLogger().debug({
        at: `${STRATEGY_NAME}/fetchFn`,
        message: "Error fetching quote",
        error: compactAxiosError(error as Error),
      });
      throw parseUniswapError(error);
    }
  };

  return {
    strategyName: STRATEGY_NAME,
    getRouter,
    getOriginEntryPoints,
    getSources,
    fetchFn,
    assertSellEntireBalanceSupported,
  };
}

export function buildUniversalRouterSwapTx(
  swap: Swap,
  tradeType: TradeType,
  quote: UniswapClassicQuoteFromApi
) {
  const routerTrade = RouterTradeAdapter.fromClassicQuote({
    tokenIn: quote.input.token,
    tokenOut: quote.output.token,
    tradeType,
    route: quote.route,
  });

  const slippageTolerance = getSlippage({
    tokenIn: swap.tokenIn,
    tokenOut: swap.tokenOut,
    slippageTolerance: swap.slippageTolerance,
  });
  const { calldata, value } = SwapRouter.swapCallParameters(routerTrade, {
    recipient: swap.recipient,
    slippageTolerance: floatToPercent(slippageTolerance),
    useRouterBalance: true,
  });
  return {
    ecosystem: "evm" as const,
    data: calldata,
    value,
    to: UNIVERSAL_ROUTER_02_ADDRESS[swap.chainId],
  };
}
