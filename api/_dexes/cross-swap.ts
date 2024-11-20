import { SpokePool } from "@across-protocol/contracts/dist/typechain";

import {
  isRouteEnabled,
  isInputTokenBridgeable,
  isOutputTokenBridgeable,
  getBridgeQuoteForMinOutput,
  getSpokePool,
  latestGasPriceCache,
} from "../_utils";
import {
  getUniswapCrossSwapQuotesForMinOutputB2A,
  getUniswapCrossSwapQuotesForMinOutputA2B,
  getBestUniswapCrossSwapQuotesForMinOutputA2A,
} from "./uniswap";
import { CrossSwap, CrossSwapQuotes } from "./types";
import { getSwapAndBridge } from "./utils";
import { tagIntegratorId } from "../_integrator-id";
import { PopulatedTransaction } from "ethers";
import { getMultiCallHandlerAddress } from "../_multicall-handler";

export type CrossSwapType =
  (typeof CROSS_SWAP_TYPE)[keyof typeof CROSS_SWAP_TYPE];

export type AmountType = (typeof AMOUNT_TYPE)[keyof typeof AMOUNT_TYPE];

export type LeftoverType = (typeof LEFTOVER_TYPE)[keyof typeof LEFTOVER_TYPE];

export const AMOUNT_TYPE = {
  EXACT_INPUT: "exactInput",
  MIN_OUTPUT: "minOutput",
} as const;

export const CROSS_SWAP_TYPE = {
  BRIDGEABLE_TO_BRIDGEABLE: "bridgeableToBridgeable",
  BRIDGEABLE_TO_ANY: "bridgeableToAny",
  ANY_TO_BRIDGEABLE: "anyToBridgeable",
  ANY_TO_ANY: "anyToAny",
} as const;

export const LEFTOVER_TYPE = {
  OUTPUT_TOKEN: "outputToken",
  BRIDGEABLE_TOKEN: "bridgeableToken",
} as const;

export const PREFERRED_BRIDGE_TOKENS = ["WETH", "USDC"];

export async function getCrossSwapQuotes(
  crossSwap: CrossSwap
): Promise<CrossSwapQuotes> {
  if (crossSwap.type === AMOUNT_TYPE.EXACT_INPUT) {
    // @TODO: Add support for exact input amount
    throw new Error("Not implemented yet");
  }

  if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT) {
    return getCrossSwapQuotesForMinOutput(crossSwap);
  }

  throw new Error("Invalid amount type");
}

export async function getCrossSwapQuotesForMinOutput(crossSwap: CrossSwap) {
  const crossSwapType = getCrossSwapType({
    inputToken: crossSwap.inputToken.address,
    originChainId: crossSwap.inputToken.chainId,
    outputToken: crossSwap.outputToken.address,
    destinationChainId: crossSwap.outputToken.chainId,
  });

  if (crossSwapType === CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE) {
    return getCrossSwapQuotesForMinOutputB2B(crossSwap);
  }

  if (crossSwapType === CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY) {
    return getCrossSwapQuotesForMinOutputB2A(crossSwap);
  }

  if (crossSwapType === CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE) {
    return getCrossSwapQuotesForMinOutputA2B(crossSwap);
  }

  if (crossSwapType === CROSS_SWAP_TYPE.ANY_TO_ANY) {
    return getCrossSwapQuotesForMinOutputA2A(crossSwap);
  }

  throw new Error("Invalid cross swap type");
}

// @TODO: Implement the following function
export async function getCrossSwapQuotesForExactInput(crossSwap: CrossSwap) {
  throw new Error("Not implemented yet");
}

export async function getCrossSwapQuotesForMinOutputB2B(crossSwap: CrossSwap) {
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    minOutputAmount: crossSwap.amount,
    // @TODO: handle ETH/WETH message generation
    message: "0x",
  });
  return {
    crossSwap,
    destinationSwapQuote: undefined,
    bridgeQuote,
    originSwapQuote: undefined,
  };
}

export async function getCrossSwapQuotesForMinOutputB2A(crossSwap: CrossSwap) {
  // @TODO: Add support for other DEXes / aggregators
  return getUniswapCrossSwapQuotesForMinOutputB2A(crossSwap);
}

export async function getCrossSwapQuotesForMinOutputA2B(crossSwap: CrossSwap) {
  // @TODO: Add support for other DEXes / aggregators
  return getUniswapCrossSwapQuotesForMinOutputA2B(crossSwap);
}

export async function getCrossSwapQuotesForMinOutputA2A(crossSwap: CrossSwap) {
  // @TODO: Add support for other DEXes / aggregators
  return getBestUniswapCrossSwapQuotesForMinOutputA2A(crossSwap, {
    preferredBridgeTokens: PREFERRED_BRIDGE_TOKENS,
    bridgeRoutesLimit: 2,
  });
}

export function getCrossSwapType(params: {
  inputToken: string;
  originChainId: number;
  outputToken: string;
  destinationChainId: number;
}): CrossSwapType {
  if (
    isRouteEnabled(
      params.originChainId,
      params.destinationChainId,
      params.inputToken,
      params.outputToken
    )
  ) {
    return CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE;
  }

  if (isInputTokenBridgeable(params.inputToken, params.originChainId)) {
    return CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY;
  }

  if (isOutputTokenBridgeable(params.outputToken, params.destinationChainId)) {
    return CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE;
  }

  return CROSS_SWAP_TYPE.ANY_TO_ANY;
}

export async function buildCrossSwapTx(
  crossSwapQuotes: CrossSwapQuotes,
  integratorId?: string
) {
  const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
  const destinationChainId = crossSwapQuotes.crossSwap.outputToken.chainId;
  const spokePool = getSpokePool(originChainId);
  const deposit = {
    depositor: crossSwapQuotes.crossSwap.depositor,
    recipient: crossSwapQuotes.destinationSwapQuote
      ? getMultiCallHandlerAddress(destinationChainId)
      : crossSwapQuotes.crossSwap.recipient,
    inputToken: crossSwapQuotes.bridgeQuote.inputToken.address,
    outputToken: crossSwapQuotes.bridgeQuote.outputToken.address,
    inputAmount: crossSwapQuotes.bridgeQuote.inputAmount,
    outputAmount: crossSwapQuotes.bridgeQuote.outputAmount,
    destinationChainid: crossSwapQuotes.bridgeQuote.outputToken.chainId,
    exclusiveRelayer:
      crossSwapQuotes.bridgeQuote.suggestedFees.exclusiveRelayer,
    quoteTimestamp: crossSwapQuotes.bridgeQuote.suggestedFees.timestamp,
    fillDeadline: await getFillDeadline(spokePool),
    exclusivityDeadline:
      crossSwapQuotes.bridgeQuote.suggestedFees.exclusivityDeadline,
    message: crossSwapQuotes.bridgeQuote.message || "0x",
  };

  let tx: PopulatedTransaction;
  let toAddress: string;

  if (crossSwapQuotes.originSwapQuote) {
    const swapAndBridge = getSwapAndBridge("uniswap", originChainId);
    tx = await swapAndBridge.populateTransaction.swapAndBridge(
      crossSwapQuotes.originSwapQuote.tokenIn.address,
      crossSwapQuotes.originSwapQuote.tokenOut.address,
      crossSwapQuotes.originSwapQuote.swapTx.data,
      crossSwapQuotes.originSwapQuote.maximumAmountIn,
      crossSwapQuotes.originSwapQuote.minAmountOut,
      deposit
    );
    toAddress = swapAndBridge.address;
  } else {
    const spokePool = getSpokePool(
      crossSwapQuotes.crossSwap.inputToken.chainId
    );
    tx = await spokePool.populateTransaction.depositV3(
      deposit.depositor,
      deposit.recipient,
      deposit.inputToken,
      deposit.outputToken,
      deposit.inputAmount,
      deposit.outputAmount,
      deposit.destinationChainid,
      deposit.exclusiveRelayer,
      deposit.quoteTimestamp,
      deposit.fillDeadline,
      deposit.exclusivityDeadline,
      deposit.message
    );
    toAddress = spokePool.address;
  }

  const [gas, gasPrice] = await Promise.all([
    spokePool.provider.estimateGas({
      from: crossSwapQuotes.crossSwap.depositor,
      ...tx,
    }),
    latestGasPriceCache(originChainId).get(),
  ]);

  return {
    from: crossSwapQuotes.crossSwap.depositor,
    to: toAddress,
    data: integratorId ? tagIntegratorId(integratorId, tx.data!) : tx.data,
    gas,
    gasPrice,
    value: tx.value,
  };
}

async function getFillDeadline(spokePool: SpokePool): Promise<number> {
  const calls = [
    spokePool.interface.encodeFunctionData("getCurrentTime"),
    spokePool.interface.encodeFunctionData("fillDeadlineBuffer"),
  ];

  const [currentTime, fillDeadlineBuffer] =
    await spokePool.callStatic.multicall(calls);
  return Number(currentTime) + Number(fillDeadlineBuffer);
}
