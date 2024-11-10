import {
  isRouteEnabled,
  isInputTokenBridgeable,
  isOutputTokenBridgeable,
  getBridgeQuoteForMinOutput,
} from "../_utils";
import {
  getUniswapCrossSwapQuotesForMinOutputB2A,
  getUniswapCrossSwapQuotesForMinOutputA2B,
  getBestUniswapCrossSwapQuotesForMinOutputA2A,
} from "./uniswap";
import { CrossSwap, CrossSwapQuotes } from "./types";

export type CrossSwapType =
  (typeof CROSS_SWAP_TYPE)[keyof typeof CROSS_SWAP_TYPE];

export type AmountType = (typeof AMOUNT_TYPE)[keyof typeof AMOUNT_TYPE];

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

export function calcFees() {}
