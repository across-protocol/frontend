import { BigNumber, BigNumberish, constants } from "ethers";
import { utils } from "@across-protocol/sdk";
import { SpokePool } from "@across-protocol/contracts/dist/typechain";

import { getSwapRouter02Strategy } from "./uniswap/swap-router-02";
import {
  buildMulticallHandlerMessage,
  encodeApproveCalldata,
  encodeDrainCalldata,
  encodeTransferCalldata,
  encodeWethWithdrawCalldata,
  getMultiCallHandlerAddress,
} from "../_multicall-handler";
import {
  CrossSwap,
  CrossSwapQuotes,
  QuoteFetchStrategy,
  SwapQuote,
  Token,
} from "./types";
import {
  isInputTokenBridgeable,
  isRouteEnabled,
  isOutputTokenBridgeable,
  getSpokePool,
} from "../_utils";
import { SpokePoolV3PeripheryInterface } from "../_typechain/SpokePoolV3Periphery";
import { TransferType } from "../_spoke-pool-periphery";
export type CrossSwapType =
  (typeof CROSS_SWAP_TYPE)[keyof typeof CROSS_SWAP_TYPE];

export type AmountType = (typeof AMOUNT_TYPE)[keyof typeof AMOUNT_TYPE];

export type QuoteFetchStrategies = Partial<{
  default: QuoteFetchStrategy;
  [chainId: number]: QuoteFetchStrategy;
}>;

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

export const PREFERRED_BRIDGE_TOKENS = ["WETH", "USDC", "USDT", "DAI"];

export const defaultQuoteFetchStrategy: QuoteFetchStrategy =
  // This will be our default strategy until the periphery contract is audited
  getSwapRouter02Strategy("UniversalSwapAndBridge");

export function getCrossSwapType(params: {
  inputToken: string;
  originChainId: number;
  outputToken: string;
  destinationChainId: number;
  isInputNative: boolean;
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

  // Prefer destination swap if input token is native because legacy
  // `UniversalSwapAndBridge` does not support native tokens as input.
  if (params.isInputNative) {
    if (isInputTokenBridgeable(params.inputToken, params.originChainId)) {
      return CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY;
    }
    // We can't bridge native tokens that are not ETH, e.g. MATIC or AZERO. Therefore
    // throw until we have periphery contract audited so that it can accept native
    // tokens and do an origin swap.
    throw new Error(
      "Unsupported swap: Input token is native but not bridgeable"
    );
  }

  if (isOutputTokenBridgeable(params.outputToken, params.destinationChainId)) {
    return CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE;
  }

  if (isInputTokenBridgeable(params.inputToken, params.originChainId)) {
    return CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY;
  }

  return CROSS_SWAP_TYPE.ANY_TO_ANY;
}

/**
 * This builds a cross-chain message for a (any/bridgeable)-to-bridgeable cross swap
 * with a specific amount of output tokens that the recipient will receive. Excess
 * tokens are refunded to the depositor.
 */
export function buildExactOutputBridgeTokenMessage(crossSwap: CrossSwap) {
  const transferActions = crossSwap.isOutputNative
    ? // WETH unwrap to ETH
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeWethWithdrawCalldata(crossSwap.amount),
          value: "0",
        },
        {
          target: crossSwap.recipient,
          callData: "0x",
          value: crossSwap.amount.toString(),
        },
      ]
    : // ERC-20 token transfer
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeTransferCalldata(
            crossSwap.recipient,
            crossSwap.amount
          ),
          value: "0",
        },
      ];
  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      ...transferActions,
      // drain remaining bridgeable output tokens from MultiCallHandler contract
      {
        target: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.refundAddress ?? crossSwap.depositor
        ),
        value: "0",
      },
    ],
  });
}

/**
 * This builds a cross-chain message for a (any/bridgeable)-to-bridgeable cross swap
 * with a min. amount of output tokens that the recipient will receive.
 */
export function buildMinOutputBridgeTokenMessage(
  crossSwap: CrossSwap,
  unwrapAmount?: BigNumber
) {
  const transferActions = crossSwap.isOutputNative
    ? // WETH unwrap to ETH
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeWethWithdrawCalldata(
            unwrapAmount || crossSwap.amount
          ),
          value: "0",
        },
        {
          target: crossSwap.recipient,
          callData: "0x",
          value: (unwrapAmount || crossSwap.amount).toString(),
        },
      ]
    : // ERC-20 token transfer
      [];
  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      ...transferActions,
      // drain remaining bridgeable output tokens from MultiCallHandler contract
      {
        target: getMultiCallHandlerAddress(crossSwap.outputToken.chainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.recipient
        ),
        value: "0",
      },
    ],
  });
}

export function getFallbackRecipient(crossSwap: CrossSwap) {
  return crossSwap.refundOnOrigin
    ? constants.AddressZero
    : (crossSwap.refundAddress ?? crossSwap.depositor);
}

export async function extractDepositDataStruct(
  crossSwapQuotes: CrossSwapQuotes,
  submissionFees?: {
    amount: BigNumberish;
    recipient: string;
  }
) {
  const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
  const destinationChainId = crossSwapQuotes.crossSwap.outputToken.chainId;
  const spokePool = getSpokePool(originChainId);
  const message = crossSwapQuotes.bridgeQuote.message || "0x";
  const refundAddress =
    crossSwapQuotes.crossSwap.refundAddress ??
    crossSwapQuotes.crossSwap.depositor;
  const baseDepositData = {
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
    destinationChainId,
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
  return {
    inputAmount: baseDepositData.inputAmount,
    baseDepositData,
    submissionFees: submissionFees || {
      amount: "0",
      recipient: constants.AddressZero,
    },
  };
}

export async function extractSwapAndDepositDataStruct(
  crossSwapQuotes: CrossSwapQuotes,
  submissionFees?: {
    amount: BigNumberish;
    recipient: string;
  }
): Promise<SpokePoolV3PeripheryInterface.SwapAndDepositDataStruct> {
  const { originSwapQuote, contracts } = crossSwapQuotes;
  const { originRouter } = contracts;
  if (!originSwapQuote || !originRouter) {
    throw new Error(
      "Can not extract 'SwapAndDepositDataStruct' without originSwapQuote and originRouter"
    );
  }

  const { baseDepositData, submissionFees: _submissionFees } =
    await extractDepositDataStruct(crossSwapQuotes, submissionFees);
  return {
    submissionFees: submissionFees || _submissionFees,
    depositData: baseDepositData,
    swapToken: originSwapQuote.tokenIn.address,
    swapTokenAmount: originSwapQuote.maximumAmountIn,
    minExpectedInputTokenAmount: originSwapQuote.minAmountOut,
    routerCalldata: originSwapQuote.swapTx.data,
    exchange: originRouter.address,
    transferType:
      originRouter.name === "UniswapV3UniversalRouter"
        ? TransferType.Transfer
        : TransferType.Approval,
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

export function getQuoteFetchStrategy(
  chainId: number,
  strategies: QuoteFetchStrategies
) {
  return strategies[chainId] ?? strategies.default ?? defaultQuoteFetchStrategy;
}

export function buildDestinationSwapCrossChainMessage({
  crossSwap,
  destinationSwapQuote,
  bridgeableOutputToken,
  routerAddress,
}: {
  crossSwap: CrossSwap;
  bridgeableOutputToken: Token;
  destinationSwapQuote: SwapQuote;
  routerAddress: string;
}) {
  const destinationSwapChainId = destinationSwapQuote.tokenOut.chainId;
  const isIndicativeQuote =
    destinationSwapQuote.swapTx.to === "0x0" &&
    destinationSwapQuote.swapTx.data === "0x0" &&
    destinationSwapQuote.swapTx.value === "0x0";

  let transferActions: {
    target: string;
    callData: string;
    value: string;
  }[] = [];

  // If output token is native, we need to unwrap WETH before sending it to the
  // recipient. This is because we only handle WETH in the destination swap.
  if (crossSwap.isOutputNative) {
    transferActions = [
      {
        target: crossSwap.outputToken.address,
        callData: encodeWethWithdrawCalldata(crossSwap.amount),
        value: "0",
      },
      {
        target: crossSwap.recipient,
        callData: "0x",
        value: crossSwap.amount.toString(),
      },
    ];
  }
  // If output token is an ERC-20 token and amount type is EXACT_OUTPUT, we need
  // to transfer the EXACT output amount to the recipient. The refundAddress / depositor
  // will receive any leftovers.
  else if (crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT) {
    transferActions = [
      {
        target: crossSwap.outputToken.address,
        callData: encodeTransferCalldata(crossSwap.recipient, crossSwap.amount),
        value: "0",
      },
      {
        target: getMultiCallHandlerAddress(destinationSwapChainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.refundAddress ?? crossSwap.depositor
        ),
        value: "0",
      },
    ];
  }
  // If output token is an ERC-20 token and amount type is MIN_OUTPUT, we need
  // to transfer all realized output tokens to the recipient.
  else if (crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT) {
    transferActions = [
      {
        target: getMultiCallHandlerAddress(destinationSwapChainId),
        callData: encodeDrainCalldata(
          crossSwap.outputToken.address,
          crossSwap.recipient
        ),
        value: "0",
      },
    ];
  }

  const swapActions = isIndicativeQuote
    ? []
    : [
        {
          target: destinationSwapQuote.swapTx.to,
          callData: destinationSwapQuote.swapTx.data,
          value: destinationSwapQuote.swapTx.value,
        },
      ];

  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      // approve bridgeable output token
      {
        target: bridgeableOutputToken.address,
        callData: encodeApproveCalldata(
          routerAddress,
          destinationSwapQuote.maximumAmountIn
        ),
        value: "0",
      },
      // swap bridgeable output token -> cross swap output token
      ...swapActions,
      // transfer output tokens to recipient
      ...transferActions,
      // drain remaining bridgeable output tokens from MultiCallHandler contract
      {
        target: getMultiCallHandlerAddress(destinationSwapChainId),
        callData: encodeDrainCalldata(
          bridgeableOutputToken.address,
          crossSwap.refundAddress ?? crossSwap.depositor
        ),
        value: "0",
      },
    ],
  });
}

export function assertMinOutputAmount(
  amountOut: BigNumber,
  expectedMinAmountOut: BigNumber
) {
  if (amountOut.lt(expectedMinAmountOut)) {
    throw new Error(
      `Swap quote output amount ${amountOut.toString()} ` +
        `is less than required min. output amount ${expectedMinAmountOut.toString()}`
    );
  }
}

export class NoQuoteFoundError extends Error {
  constructor(params: {
    originSwapChainId: number;
    inputTokenSymbol: string;
    destinationSwapChainId: number;
    outputTokenSymbol: string;
  }) {
    super(
      `No quote found for ${params.originSwapChainId} ${params.inputTokenSymbol} -> ${params.destinationSwapChainId} ${params.outputTokenSymbol}`
    );
  }
}
