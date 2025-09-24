import { TradeType } from "@uniswap/sdk-core";

import {
  CHAIN_IDs,
  MULTICALL3_ADDRESS,
  TOKEN_SYMBOLS_MAP,
} from "../../_constants";
import { getMulticall3, getMulticall3Address } from "../../_utils";
import { QuoteFetchOpts, QuoteFetchStrategy, Swap, EvmSwapTxn } from "../types";
import { getWghoContract } from "./utils/wgho";
import { getSwapRouter02Strategy } from "../uniswap/swap-router-02";
import { encodeApproveCalldata } from "../../_multicall-handler";
import { getErc20 } from "../../_erc20";
import { getOriginSwapEntryPoints, makeGetSources } from "../utils";
import {
  UPSTREAM_SWAP_PROVIDER_ERRORS,
  UpstreamSwapProviderError,
} from "../../_errors";

const SWAP_PROVIDER_NAME = "gho-multicall3";

/**
 * Returns a swap quote fetch strategy for handling Stable -> GHO swaps.
 */
export function getWghoMulticallStrategy(): QuoteFetchStrategy {
  const getRouter = (chainId: number) => {
    return {
      address: getMulticall3Address(chainId) ?? MULTICALL3_ADDRESS,
      name: "Multicall3",
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

    const { tokenIn, tokenOut, amount, chainId } = swap;

    // Only support:
    // - L1 USDC/DAI/USDT -> L1 WGHO
    if (![CHAIN_IDs.MAINNET].includes(chainId)) {
      throw new Error(
        `Unsupported chain (${chainId}) for swaps using GHO-Multicall3`
      );
    }
    if (!["USDC", "DAI", "USDT"].includes(tokenIn.symbol)) {
      throw new Error(
        `Unsupported input token (${tokenIn.symbol}) for swaps using GHO-Multicall3`
      );
    }
    if (tokenOut.symbol !== "WGHO") {
      throw new Error(
        `Unsupported output token (${tokenOut.symbol}) for swaps using GHO-Multicall3`
      );
    }

    const multicall3 = getMulticall3(chainId);
    if (!multicall3) {
      throw new Error(`Multicall3 not found for chain ${chainId}`);
    }

    // 1. Transfer `tokenIn` to the Multicall3 contract
    const erc20 = getErc20({
      chainId,
      tokenAddress: tokenIn.address,
    });
    const transferCall = {
      callData: erc20.interface.encodeFunctionData("transferFrom", [
        getOriginEntryPoints(chainId).originSwapInitialRecipient.address,
        getRouter(chainId).address,
        amount,
      ]),
      target: tokenIn.address,
    };

    // 2. Perform swap via Uniswap Stable -> GHO
    const swapRouter02Strategy = getSwapRouter02Strategy(
      "SpokePoolPeriphery",
      "trading-api"
    );
    const ghoSwap = {
      ...swap,
      recipient: getRouter(chainId).address,
      tokenOut: {
        address: TOKEN_SYMBOLS_MAP.GHO.addresses[chainId],
        symbol: TOKEN_SYMBOLS_MAP.GHO.symbol,
        decimals: TOKEN_SYMBOLS_MAP.GHO.decimals,
        chainId,
      },
      tokenIn,
      amount,
      chainId,
    };
    const ghoSwapQuote = await swapRouter02Strategy.fetchFn(
      ghoSwap,
      tradeType,
      opts
    );
    // 2.1. Approve `SwapRouter02` to pull in stable tokenIn
    const approveSwapRouter02Call = {
      callData: encodeApproveCalldata(
        swapRouter02Strategy.getRouter(chainId).address,
        ghoSwapQuote.maximumAmountIn
      ),
      target: ghoSwapQuote.tokenIn.address,
    };

    if (ghoSwapQuote.swapTxns.length !== 1) {
      throw new Error(
        "Expected exactly 1 swap transaction for Stable -> GHO via `SwapRouter02`"
      );
    }
    // 2.2. Perform the Stable -> GHO swap via `SwapRouter02`
    const swapTxn = ghoSwapQuote.swapTxns[0] as EvmSwapTxn;
    const swapCall = {
      callData: swapTxn.data,
      target: swapTxn.to,
    };

    // 3. Perform wrap via `WGHO`
    const amountToWrap = ghoSwapQuote.expectedAmountOut; // TODO: Use `minAmountOut`? How to drain tokens
    const wgho = getWghoContract(chainId);
    // 3.1. Approve WGHO to pull in GHO
    const approveWghoCall = {
      callData: encodeApproveCalldata(wgho.address, amountToWrap),
      target: TOKEN_SYMBOLS_MAP.GHO.addresses[chainId],
    };
    // 3.2. Perform wrap
    const wrapCall = {
      callData: wgho.interface.encodeFunctionData("depositFor", [
        getOriginEntryPoints(chainId).originSwapInitialRecipient.address,
        amountToWrap,
      ]),
      target: wgho.address,
    };

    // Encode as aggregate calldata
    const calls = [
      transferCall,
      approveSwapRouter02Call,
      swapCall,
      approveWghoCall,
      wrapCall,
    ];
    const aggregateTx = {
      ecosystem: "evm" as const,
      data: multicall3.interface.encodeFunctionData("aggregate", [calls]),
      to: getRouter(chainId).address,
      value: "0",
    };

    return {
      tokenIn,
      tokenOut,
      maximumAmountIn: ghoSwapQuote.maximumAmountIn,
      minAmountOut: ghoSwapQuote.minAmountOut,
      expectedAmountOut: ghoSwapQuote.expectedAmountOut,
      expectedAmountIn: ghoSwapQuote.expectedAmountIn,
      slippageTolerance: swap.slippageTolerance,
      swapTxns: [aggregateTx],
      swapProvider: {
        name: SWAP_PROVIDER_NAME,
        sources: [SWAP_PROVIDER_NAME, "uniswap_v3"],
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
