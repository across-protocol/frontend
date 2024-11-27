import { SpokePool } from "@across-protocol/contracts/dist/typechain";
import { ethers, PopulatedTransaction } from "ethers";
import { utils } from "@across-protocol/sdk";

import {
  isRouteEnabled,
  isInputTokenBridgeable,
  isOutputTokenBridgeable,
  getBridgeQuoteForMinOutput,
  getSpokePool,
} from "../_utils";
import {
  getUniswapCrossSwapQuotesForOutputB2A,
  getUniswapCrossSwapQuotesForOutputA2B,
  getBestUniswapCrossSwapQuotesForOutputA2A,
} from "./uniswap/swap-router-02";
import { CrossSwap, CrossSwapQuotes } from "./types";
import {
  buildExactOutputBridgeTokenMessage,
  buildMinOutputBridgeTokenMessage,
} from "./utils";
import { getSpokePoolPeriphery } from "../_spoke-pool-periphery";
import { tagIntegratorId } from "../_integrator-id";
import { getMultiCallHandlerAddress } from "../_multicall-handler";
import { getPermitTypedData } from "../_permit";
import { getTransferWithAuthTypedData } from "../_transferWithAuth";

export type CrossSwapType =
  (typeof CROSS_SWAP_TYPE)[keyof typeof CROSS_SWAP_TYPE];

export type AmountType = (typeof AMOUNT_TYPE)[keyof typeof AMOUNT_TYPE];

export type LeftoverType = (typeof LEFTOVER_TYPE)[keyof typeof LEFTOVER_TYPE];

export const AMOUNT_TYPE = {
  EXACT_INPUT: "exactInput",
  EXACT_OUTPUT: "exactOutput",
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

  if (
    crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT ||
    crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT
  ) {
    return getCrossSwapQuotesForOutput(crossSwap);
  }

  throw new Error("Invalid amount type");
}

export async function getCrossSwapQuotesForOutput(crossSwap: CrossSwap) {
  const crossSwapType = getCrossSwapType({
    inputToken: crossSwap.inputToken.address,
    originChainId: crossSwap.inputToken.chainId,
    outputToken: crossSwap.outputToken.address,
    destinationChainId: crossSwap.outputToken.chainId,
  });

  if (crossSwapType === CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE) {
    return getCrossSwapQuotesForOutputB2B(crossSwap);
  }

  if (crossSwapType === CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY) {
    return getCrossSwapQuotesForOutputB2A(crossSwap);
  }

  if (crossSwapType === CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE) {
    return getCrossSwapQuotesForOutputA2B(crossSwap);
  }

  if (crossSwapType === CROSS_SWAP_TYPE.ANY_TO_ANY) {
    return getCrossSwapQuotesForOutputA2A(crossSwap);
  }

  throw new Error("Invalid cross swap type");
}

// @TODO: Implement the following function
export async function getCrossSwapQuotesForExactInput(crossSwap: CrossSwap) {
  throw new Error("Not implemented yet");
}

export async function getCrossSwapQuotesForOutputB2B(crossSwap: CrossSwap) {
  const bridgeQuote = await getBridgeQuoteForMinOutput({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    minOutputAmount: crossSwap.amount,
    recipient: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
    message:
      crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT
        ? buildExactOutputBridgeTokenMessage(crossSwap)
        : buildMinOutputBridgeTokenMessage(crossSwap),
  });

  if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT) {
    bridgeQuote.message = buildMinOutputBridgeTokenMessage(
      crossSwap,
      bridgeQuote.outputAmount
    );
  }

  return {
    crossSwap,
    destinationSwapQuote: undefined,
    bridgeQuote,
    originSwapQuote: undefined,
  };
}

export async function getCrossSwapQuotesForOutputB2A(crossSwap: CrossSwap) {
  // @TODO: Add support for other DEXes / aggregators
  return getUniswapCrossSwapQuotesForOutputB2A(crossSwap);
}

export async function getCrossSwapQuotesForOutputA2B(crossSwap: CrossSwap) {
  // @TODO: Add support for other DEXes / aggregators
  return getUniswapCrossSwapQuotesForOutputA2B(crossSwap);
}

export async function getCrossSwapQuotesForOutputA2A(crossSwap: CrossSwap) {
  // @TODO: Add support for other DEXes / aggregators
  return getBestUniswapCrossSwapQuotesForOutputA2A(crossSwap, {
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

  if (isOutputTokenBridgeable(params.outputToken, params.destinationChainId)) {
    return CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE;
  }

  if (isInputTokenBridgeable(params.inputToken, params.originChainId)) {
    return CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY;
  }

  return CROSS_SWAP_TYPE.ANY_TO_ANY;
}

export async function buildCrossSwapTxForAllowanceHolder(
  crossSwapQuotes: CrossSwapQuotes,
  integratorId?: string
) {
  const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
  const spokePool = getSpokePool(originChainId);
  const spokePoolPeriphery = getSpokePoolPeriphery("uniswap", originChainId);
  const deposit = await extractDepositDataStruct(crossSwapQuotes);

  let tx: PopulatedTransaction;
  let toAddress: string;

  if (crossSwapQuotes.originSwapQuote) {
    tx = await spokePoolPeriphery.populateTransaction.swapAndBridge(
      crossSwapQuotes.originSwapQuote.tokenIn.address,
      crossSwapQuotes.originSwapQuote.tokenOut.address,
      crossSwapQuotes.originSwapQuote.swapTx.data,
      crossSwapQuotes.originSwapQuote.maximumAmountIn,
      crossSwapQuotes.originSwapQuote.minAmountOut,
      deposit,
      {
        value: crossSwapQuotes.crossSwap.isInputNative
          ? crossSwapQuotes.originSwapQuote.maximumAmountIn
          : 0,
      }
    );
    toAddress = spokePoolPeriphery.address;
  } else {
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
      deposit.message,
      {
        value: crossSwapQuotes.crossSwap.isInputNative
          ? deposit.inputAmount
          : 0,
      }
    );
    toAddress = spokePool.address;
  }

  return {
    from: crossSwapQuotes.crossSwap.depositor,
    to: toAddress,
    data: integratorId ? tagIntegratorId(integratorId, tx.data!) : tx.data,
    value: tx.value,
  };
}

export async function getCrossSwapTxForPermit(
  crossSwapQuotes: CrossSwapQuotes,
  permitDeadline: number
) {
  const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
  const spokePoolPeriphery = getSpokePoolPeriphery("uniswap", originChainId);
  const deposit = await extractDepositDataStruct(crossSwapQuotes);

  let methodName: string;
  let argsWithoutSignature: Record<string, unknown>;
  if (crossSwapQuotes.originSwapQuote) {
    methodName = "swapAndBridgeWithPermit";
    argsWithoutSignature = {
      swapToken: crossSwapQuotes.originSwapQuote.tokenIn.address,
      acrossInputToken: crossSwapQuotes.originSwapQuote.tokenOut.address,
      routerCalldata: crossSwapQuotes.originSwapQuote.swapTx.data,
      swapTokenAmount: crossSwapQuotes.originSwapQuote.maximumAmountIn,
      minExpectedInputTokenAmount: crossSwapQuotes.originSwapQuote.minAmountOut,
      depositData: deposit,
      deadline: permitDeadline,
    };
  } else {
    methodName = "depositWithPermit";
    argsWithoutSignature = {
      acrossInputToken: crossSwapQuotes.bridgeQuote.inputToken.address,
      acrossInputAmount: crossSwapQuotes.bridgeQuote.inputAmount,
      depositData: deposit,
      deadline: permitDeadline,
    };
  }

  const permitTypedData = await getPermitTypedData({
    tokenAddress:
      crossSwapQuotes.originSwapQuote?.tokenIn.address ||
      crossSwapQuotes.bridgeQuote.inputToken.address,
    chainId: originChainId,
    ownerAddress: crossSwapQuotes.crossSwap.depositor,
    spenderAddress: spokePoolPeriphery.address,
    value:
      crossSwapQuotes.originSwapQuote?.maximumAmountIn ||
      crossSwapQuotes.bridgeQuote.inputAmount,
    deadline: permitDeadline,
  });
  return {
    permit: {
      eip712: permitTypedData.eip712,
    },
    swapTx: {
      chainId: originChainId,
      to: spokePoolPeriphery.address,
      methodName,
      argsWithoutSignature,
    },
  };
}

export async function getCrossSwapTxForTransferWithAuthorization(
  crossSwapQuotes: CrossSwapQuotes,
  validBefore: number,
  validAfter = 0
) {
  const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
  const spokePoolPeriphery = getSpokePoolPeriphery("uniswap", originChainId);
  const deposit = await extractDepositDataStruct(crossSwapQuotes);

  let methodName: string;
  let argsWithoutSignature: Record<string, unknown>;

  // random non-sequesntial nonce
  const nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));

  if (crossSwapQuotes.originSwapQuote) {
    methodName = "swapAndBridgeWithAuthorization";
    argsWithoutSignature = {
      swapToken: crossSwapQuotes.originSwapQuote.tokenIn.address,
      acrossInputToken: crossSwapQuotes.originSwapQuote.tokenOut.address,
      routerCalldata: crossSwapQuotes.originSwapQuote.swapTx.data,
      swapTokenAmount: crossSwapQuotes.originSwapQuote.maximumAmountIn,
      minExpectedInputTokenAmount: crossSwapQuotes.originSwapQuote.minAmountOut,
      depositData: deposit,
      validAfter,
      validBefore,
      nonce,
    };
  } else {
    methodName = "depositWithAuthorization";
    argsWithoutSignature = {
      acrossInputToken: crossSwapQuotes.bridgeQuote.inputToken.address,
      acrossInputAmount: crossSwapQuotes.bridgeQuote.inputAmount,
      depositData: deposit,
      validAfter,
      validBefore,
      nonce,
    };
  }

  const authTypedData = await getTransferWithAuthTypedData({
    tokenAddress:
      crossSwapQuotes.originSwapQuote?.tokenIn.address ||
      crossSwapQuotes.bridgeQuote.inputToken.address,
    chainId: originChainId,
    ownerAddress: crossSwapQuotes.crossSwap.depositor,
    receiverAddress: spokePoolPeriphery.address,
    value:
      crossSwapQuotes.originSwapQuote?.maximumAmountIn ||
      crossSwapQuotes.bridgeQuote.inputAmount,
    validBefore,
    validAfter,
    nonce,
  });

  return {
    authorization: {
      eip712: authTypedData.eip712,
    },
    swapTx: {
      chainId: originChainId,
      to: spokePoolPeriphery.address,
      methodName,
      argsWithoutSignature,
    },
  };
}

async function extractDepositDataStruct(crossSwapQuotes: CrossSwapQuotes) {
  const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
  const destinationChainId = crossSwapQuotes.crossSwap.outputToken.chainId;
  const spokePool = getSpokePool(originChainId);
  const message = crossSwapQuotes.bridgeQuote.message || "0x";
  const refundAddress =
    crossSwapQuotes.crossSwap.refundAddress ??
    crossSwapQuotes.crossSwap.depositor;
  const deposit = {
    depositor: crossSwapQuotes.crossSwap.refundOnOrigin
      ? refundAddress
      : crossSwapQuotes.crossSwap.depositor,
    recipient: utils.isMessageEmpty(message)
      ? crossSwapQuotes.crossSwap.recipient
      : getMultiCallHandlerAddress(destinationChainId),
    inputToken: crossSwapQuotes.bridgeQuote.inputToken.address,
    outputToken: crossSwapQuotes.bridgeQuote.outputToken.address,
    inputAmount: crossSwapQuotes.bridgeQuote.inputAmount,
    outputAmount: crossSwapQuotes.bridgeQuote.outputAmount,
    destinationChainid: destinationChainId,
    exclusiveRelayer:
      crossSwapQuotes.bridgeQuote.suggestedFees.exclusiveRelayer,
    quoteTimestamp: crossSwapQuotes.bridgeQuote.suggestedFees.timestamp,
    fillDeadline: await getFillDeadline(spokePool),
    exclusivityDeadline:
      crossSwapQuotes.bridgeQuote.suggestedFees.exclusivityDeadline,
    exclusivityParameter:
      crossSwapQuotes.bridgeQuote.suggestedFees.exclusivityDeadline,
    message,
  };
  return deposit;
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
