import { TradeType } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../_constants";
import { QuoteFetchOpts, QuoteFetchStrategy, Swap, EvmSwapTxn } from "../types";
import { getWghoContract, WGHO_ADDRESS } from "./utils/wgho";
import { getSwapRouter02Strategy } from "../uniswap/swap-router-02";
import { encodeApproveCalldata } from "../../_multicall-handler";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";
import {
  UPSTREAM_SWAP_PROVIDER_ERRORS,
  UpstreamSwapProviderError,
} from "../../_errors";
import { getSlippage } from "../../_slippage";

const SWAP_PROVIDER_NAME = "wrapped-gho";

/**
 * Returns a swap quote fetch strategy for handling GHO/WGHO swaps.
 */
export function getWrappedGhoStrategy(): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    const address = WGHO_ADDRESS[chainId];
    if (!address) {
      throw new Error(`WGHO address not found for chain ${chainId}`);
    }
    return {
      address,
      name: "WGHO",
    };
  };

  const getOriginEntryPoints = (chainId: number) =>
    getOriginSwapEntryPoints("SpokePoolPeriphery", chainId, SWAP_PROVIDER_NAME);

  const getSources = makeGetSources({
    strategy: SWAP_PROVIDER_NAME,
    sources: {
      [CHAIN_IDs.MAINNET]: [
        { key: SWAP_PROVIDER_NAME, names: [SWAP_PROVIDER_NAME] },
      ],
    },
  });

  const assertSellEntireBalanceSupported = () => {
    throw new UpstreamSwapProviderError({
      message: `Option 'sellEntireBalance' is not supported by ${SWAP_PROVIDER_NAME}`,
      code: UPSTREAM_SWAP_PROVIDER_ERRORS.SELL_ENTIRE_BALANCE_UNSUPPORTED,
      swapProvider: SWAP_PROVIDER_NAME,
    });
  };

  const fetchFn = async (
    swap: Swap,
    tradeType: TradeType,
    opts?: QuoteFetchOpts
  ) => {
    if (opts?.sellEntireBalance && opts?.throwIfSellEntireBalanceUnsupported) {
      assertSellEntireBalanceSupported();
    }

    const { tokenIn, tokenOut, amount, chainId, recipient } = swap;

    const slippageTolerance = getSlippage({
      tokenIn: swap.tokenIn,
      tokenOut: swap.tokenOut,
      slippageTolerance: swap.slippageTolerance,
      originOrDestination: swap.originOrDestination,
      splitSlippage: opts?.splitSlippage,
    });

    // Only support:
    // - L1 GHO -> L1 WGHO
    // - L1 WGHO -> L1 GHO
    // - L1 WGHO -> L1 Stable
    if (
      ![CHAIN_IDs.MAINNET].includes(chainId) ||
      !["GHO", "WGHO"].includes(tokenIn.symbol)
    ) {
      throw new Error(
        `Unsupported input token (${tokenIn.symbol}) or chain (${chainId}) for GHO/WGHO swaps`
      );
    }

    const wgho = getWghoContract(chainId);
    const swapTxns: EvmSwapTxn[] = [];

    // Depending on the swap route, we need to encode different calldata
    // - L1 GHO -> L1 WGHO : encode `depositFor`
    // - L1 WGHO -> L1 GHO : encode `withdrawTo`
    // - L1 WGHO -> L1 Stable : encode `withdrawTo` + swap via `SwapRouter02`
    const swapTx1Calldata =
      tokenIn.symbol === "GHO"
        ? wgho.interface.encodeFunctionData("depositFor", [recipient, amount])
        : wgho.interface.encodeFunctionData("withdrawTo", [recipient, amount]);
    swapTxns.push({
      ecosystem: "evm" as const,
      data: swapTx1Calldata,
      value: "0",
      to: wgho.address,
    });

    // If the output token is GHO or WGHO, we don't need to encode any additional calldata.
    if (["GHO", "WGHO"].includes(tokenOut.symbol)) {
      return {
        tokenIn,
        tokenOut,
        maximumAmountIn: BigNumber.from(amount),
        minAmountOut: BigNumber.from(amount),
        expectedAmountOut: BigNumber.from(amount),
        expectedAmountIn: BigNumber.from(amount),
        slippageTolerance,
        swapTxns,
        swapProvider: {
          name: SWAP_PROVIDER_NAME,
          sources: ["wgho", SWAP_PROVIDER_NAME],
        },
      };
    }

    // If we get here, we need to encode the calldata for the swap GHO -> Any via `SwapRouter02`.
    const swapRouter02Strategy = getSwapRouter02Strategy(
      "SpokePoolPeriphery",
      "trading-api"
    );
    const ghoSwap = {
      ...swap,
      tokenIn: {
        address: TOKEN_SYMBOLS_MAP.GHO.addresses[chainId],
        symbol: TOKEN_SYMBOLS_MAP.GHO.symbol,
        decimals: TOKEN_SYMBOLS_MAP.GHO.decimals,
        chainId,
      },
      tokenOut,
      amount,
      chainId,
    };
    const ghoSwapQuote = await swapRouter02Strategy.fetchFn(
      ghoSwap,
      tradeType,
      opts
    );
    // Encode approval calldata for the swap via `SwapRouter02`.
    swapTxns.push({
      ecosystem: "evm" as const,
      data: encodeApproveCalldata(
        swapRouter02Strategy.getRouter(chainId).address,
        ghoSwapQuote.maximumAmountIn
      ),
      value: "0",
      to: ghoSwapQuote.tokenIn.address,
    });

    if (ghoSwapQuote.swapTxns.length !== 1) {
      throw new Error(
        "Expected exactly 1 swap transaction for GHO -> Stable via `SwapRouter02`"
      );
    }
    // Encode the swap calldata via `SwapRouter02`.
    const swapTxn = ghoSwapQuote.swapTxns[0] as EvmSwapTxn;
    swapTxns.push({
      ecosystem: "evm" as const,
      data: swapTxn.data,
      value: swapTxn.value,
      to: swapTxn.to,
    });

    return {
      tokenIn,
      tokenOut,
      maximumAmountIn: ghoSwapQuote.maximumAmountIn,
      minAmountOut: ghoSwapQuote.minAmountOut,
      expectedAmountOut: ghoSwapQuote.expectedAmountOut,
      expectedAmountIn: ghoSwapQuote.expectedAmountIn,
      slippageTolerance,
      swapTxns,
      swapProvider: {
        name: SWAP_PROVIDER_NAME,
        sources: ["wgho", SWAP_PROVIDER_NAME, "uniswap_v3"],
      },
    };
  };

  return {
    strategyName: SWAP_PROVIDER_NAME,
    getRouter,
    getOriginEntryPoints,
    fetchFn,
    getSources,
    assertSellEntireBalanceSupported,
  };
}
