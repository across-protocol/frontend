import { TradeType } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../_constants";
import { getUniversalSwapAndBridgeAddress } from "../../_swap-and-bridge";
import { getSpokePoolAddress } from "../../_utils";
import { QuoteFetchStrategy, Swap } from "../types";
import { getWghoContract, WGHO_ADDRESS } from "./utils/wgho";
import { getSwapRouter02Strategy } from "../uniswap/swap-router-02";
import { encodeApproveCalldata } from "../../_multicall-handler";

/**
 * Returns a swap quote fetch strategy for handling GHO/WGHO swaps.
 */
export function getGhoStrategy(): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    return {
      address: WGHO_ADDRESS[chainId],
      name: "WGHO",
    };
  };

  const getOriginEntryPoints = (chainId: number) => {
    return {
      swapAndBridge: {
        name: "UniversalSwapAndBridge",
        address: getUniversalSwapAndBridgeAddress("gho", chainId),
        dex: "gho",
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
    opts: Partial<{
      useIndicativeQuote: boolean;
    }> = {
      useIndicativeQuote: false,
    }
  ) => {
    const { tokenIn, tokenOut, amount, chainId, recipient } = swap;

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
    const swapTxns: {
      data: string;
      value: string;
      to: string;
    }[] = [];

    // Depending on the swap route, we need to encode different calldata
    // - L1 GHO -> L1 WGHO : encode `depositFor`
    // - L1 WGHO -> L1 GHO : encode `withdrawTo`
    // - L1 WGHO -> L1 Stable : encode `withdrawTo` + swap via `SwapRouter02`
    const swapTx1Calldata =
      tokenIn.symbol === "GHO"
        ? wgho.interface.encodeFunctionData("depositFor", [recipient, amount])
        : wgho.interface.encodeFunctionData("withdrawTo", [recipient, amount]);
    swapTxns.push({
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
        slippageTolerance: swap.slippageTolerance,
        swapTxns,
      };
    }

    // If we get here, we need to encode the calldata for the swap GHO -> Any via `SwapRouter02`.
    const swapRouter02Strategy = getSwapRouter02Strategy(
      "UniversalSwapAndBridge",
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
    swapTxns.push({
      data: ghoSwapQuote.swapTxns[0].data,
      value: ghoSwapQuote.swapTxns[0].value,
      to: ghoSwapQuote.swapTxns[0].to,
    });

    return {
      tokenIn,
      tokenOut,
      maximumAmountIn: ghoSwapQuote.maximumAmountIn,
      minAmountOut: ghoSwapQuote.minAmountOut,
      expectedAmountOut: ghoSwapQuote.expectedAmountOut,
      expectedAmountIn: ghoSwapQuote.expectedAmountIn,
      slippageTolerance: swap.slippageTolerance,
      swapTxns,
    };
  };

  return {
    getRouter,
    getOriginEntryPoints,
    fetchFn,
  };
}
