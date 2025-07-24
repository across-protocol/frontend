import { BigNumber, BigNumberish, constants } from "ethers";
import { utils } from "@across-protocol/sdk";
import { SpokePool } from "@across-protocol/contracts/dist/typechain";
import { CHAIN_IDs } from "@across-protocol/constants";

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
  OriginEntryPointContractName,
  OriginEntryPoints,
  QuoteFetchStrategy,
  SupportedDex,
  Swap,
  SwapQuote,
  Token,
  DexSources,
} from "./types";
import {
  isInputTokenBridgeable,
  isRouteEnabled,
  isOutputTokenBridgeable,
  getSpokePool,
  getSpokePoolAddress,
} from "../_utils";
import {
  getSpokePoolPeripheryAddress,
  TransferType,
  getSwapProxyAddress,
} from "../_spoke-pool-periphery";
import { getUniversalSwapAndBridgeAddress } from "../_swap-and-bridge";
import axios, { AxiosRequestHeaders } from "axios";
import { encodeActionCalls } from "../swap/_utils";

export type CrossSwapType =
  (typeof CROSS_SWAP_TYPE)[keyof typeof CROSS_SWAP_TYPE];

export type AmountType = (typeof AMOUNT_TYPE)[keyof typeof AMOUNT_TYPE];

/**
 * Describes which quote fetch strategies to use for a given chain,
 *
 * @example
 * {
 *   default: [getSwapRouter02Strategy("UniversalSwapAndBridge", "trading-api")],
 *   [CHAIN_IDs.MAINNET]: [getSwapRouter02Strategy("UniversalSwapAndBridge", "sdk")],
 * }
 */
export type QuoteFetchStrategies = Partial<{
  default: QuoteFetchStrategy[];
  chains: {
    [chainId: number]: QuoteFetchStrategy[];
  };
  swapPairs: {
    [chainId: number]: {
      [tokenInSymbol: string]: {
        [tokenOutSymbol: string]: QuoteFetchStrategy[];
      };
    };
  };
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

export const PREFERRED_BRIDGE_TOKENS: {
  default: string[];
  [fromChainId: number]: {
    [toChainId: number]: string[];
  };
} = {
  default: ["WETH", "USDC", "USDT", "DAI"],
  [CHAIN_IDs.MAINNET]: {
    [232]: ["WGHO", "WETH", "USDC"],
  },
  [232]: {
    [CHAIN_IDs.MAINNET]: ["WGHO", "WETH", "USDC"],
  },
};

export const defaultQuoteFetchStrategies: QuoteFetchStrategy[] =
  // These will be our default strategies until the periphery contract is audited
  [getSwapRouter02Strategy("UniversalSwapAndBridge")];

export function getPreferredBridgeTokens(
  fromChainId: number,
  toChainId: number
) {
  return (
    PREFERRED_BRIDGE_TOKENS[fromChainId]?.[toChainId] ??
    PREFERRED_BRIDGE_TOKENS.default
  );
}

export function getCrossSwapTypes(params: {
  inputToken: string;
  originChainId: number;
  outputToken: string;
  destinationChainId: number;
  isInputNative: boolean;
  isOutputNative: boolean;
}): CrossSwapType[] {
  if (
    isRouteEnabled(
      params.originChainId,
      params.destinationChainId,
      params.inputToken,
      params.outputToken
    )
  ) {
    return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE];
  }

  const inputBridgeable = isInputTokenBridgeable(
    params.inputToken,
    params.originChainId,
    params.destinationChainId
  );
  const outputBridgeable = isOutputTokenBridgeable(
    params.outputToken,
    params.originChainId,
    params.destinationChainId
  );

  // Prefer destination swap if input token is native because legacy
  // `UniversalSwapAndBridge` does not support native tokens as input.
  if (params.isInputNative) {
    if (inputBridgeable) {
      return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY];
    }
    // We can't bridge native tokens that are not ETH, e.g. MATIC or AZERO. Therefore
    // throw until we have periphery contract audited so that it can accept native
    // tokens and do an origin swap.
    throw new Error(
      "Unsupported swap: Input token is native but not bridgeable"
    );
  }

  if (inputBridgeable && outputBridgeable) {
    return [
      CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE,
      CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY,
    ];
  }

  if (outputBridgeable) {
    return [CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE];
  }

  if (inputBridgeable) {
    return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_ANY];
  }

  return [CROSS_SWAP_TYPE.ANY_TO_ANY];
}

export function buildExactInputBridgeTokenMessage(
  crossSwap: CrossSwap,
  outputAmount: BigNumber
) {
  const unwrapActions = crossSwap.isOutputNative
    ? // WETH unwrap to ETH
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeWethWithdrawCalldata(outputAmount),
          value: "0",
        },
      ]
    : [];
  const transferActions = crossSwap.isOutputNative
    ? // ETH transfer
      [
        {
          target: crossSwap.recipient,
          callData: "0x",
          value: outputAmount.toString(),
        },
      ]
    : // ERC-20 token transfer
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeTransferCalldata(crossSwap.recipient, outputAmount),
          value: "0",
        },
      ];
  const embeddedActions = crossSwap.embeddedActions
    ? encodeActionCalls(
        crossSwap.embeddedActions,
        crossSwap.outputToken.chainId
      )
    : [];

  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      // unwrap weth if output token is native
      ...unwrapActions,
      // execute destination actions or transfer output tokens
      ...(embeddedActions.length > 0 ? embeddedActions : transferActions),
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

/**
 * This builds a cross-chain message for a (any/bridgeable)-to-bridgeable cross swap
 * with a specific amount of output tokens that the recipient will receive. Excess
 * tokens are refunded to the depositor.
 */
export function buildExactOutputBridgeTokenMessage(crossSwap: CrossSwap) {
  const unwrapActions = crossSwap.isOutputNative
    ? // WETH unwrap to ETH
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeWethWithdrawCalldata(crossSwap.amount),
          value: "0",
        },
      ]
    : [];
  const transferActions = crossSwap.isOutputNative
    ? // ETH transfer
      [
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
  const embeddedActions = crossSwap.embeddedActions
    ? encodeActionCalls(
        crossSwap.embeddedActions,
        crossSwap.outputToken.chainId
      )
    : [];

  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      // unwrap weth if output token is native
      ...unwrapActions,
      // execute destination actions or transfer output tokens
      ...(embeddedActions.length > 0 ? embeddedActions : transferActions),
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
  const unwrapActions = crossSwap.isOutputNative
    ? // WETH unwrap to ETH
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeWethWithdrawCalldata(
            unwrapAmount || crossSwap.amount
          ),
          value: "0",
        },
      ]
    : [];
  const transferActions = crossSwap.isOutputNative
    ? // ETH transfer
      [
        {
          target: crossSwap.recipient,
          callData: "0x",
          value: (unwrapAmount || crossSwap.amount).toString(),
        },
      ]
    : // ERC-20 token transfer
      [
        {
          target: crossSwap.outputToken.address,
          callData: encodeTransferCalldata(
            crossSwap.recipient,
            unwrapAmount || crossSwap.amount
          ),
          value: "0",
        },
      ];

  const embeddedActions = crossSwap.embeddedActions
    ? encodeActionCalls(
        crossSwap.embeddedActions,
        crossSwap.outputToken.chainId
      )
    : [];
  return buildMulticallHandlerMessage({
    fallbackRecipient: getFallbackRecipient(crossSwap),
    actions: [
      // unwrap weth if output token is native
      ...unwrapActions,
      // execute destination actions or transfer output tokens
      ...(embeddedActions.length > 0 ? embeddedActions : transferActions),
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
  transferType: TransferType,
  permitNonce?: number,
  submissionFees?: {
    amount: BigNumberish;
    recipient: string;
  }
) {
  const { originSwapQuote, contracts } = crossSwapQuotes;
  const { originRouter } = contracts;
  if (!originSwapQuote || !originRouter) {
    throw new Error(
      "Can not extract 'SwapAndDepositDataStruct' without originSwapQuote and originRouter"
    );
  }
  if (originSwapQuote.swapTxns.length !== 1) {
    throw new Error(
      "Can not extract 'SwapAndDepositDataStruct' without a single swap transaction"
    );
  }
  const spokePool = getSpokePool(originSwapQuote.tokenIn.chainId);

  const { baseDepositData, submissionFees: _submissionFees } =
    await extractDepositDataStruct(crossSwapQuotes, submissionFees);
  return {
    submissionFees: submissionFees || _submissionFees,
    depositData: baseDepositData,
    swapToken: originSwapQuote.tokenIn.address,
    swapTokenAmount: originSwapQuote.maximumAmountIn,
    minExpectedInputTokenAmount: originSwapQuote.minAmountOut,
    routerCalldata: originSwapQuote.swapTxns[0].data,
    exchange: originRouter.address,
    transferType,
    enableProportionalAdjustment: true,
    spokePool: spokePool.address,
    nonce: permitNonce || 0, // Only used for permit transfers
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

export function getQuoteFetchStrategies(
  chainId: number,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  strategies: QuoteFetchStrategies
): QuoteFetchStrategy[] {
  return (
    strategies.swapPairs?.[chainId]?.[tokenInSymbol]?.[tokenOutSymbol] ??
    strategies.chains?.[chainId] ??
    strategies.default ??
    defaultQuoteFetchStrategies
  );
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
  const isIndicativeQuote = destinationSwapQuote.swapTxns.every(
    (swapTxn) =>
      swapTxn.to === "0x0" && swapTxn.data === "0x0" && swapTxn.value === "0x0"
  );

  type Action = {
    target: string;
    callData: string;
    value: string;
  };

  let transferActions: Action[] = [];
  let unwrapActions: Action[] = [];

  // If output token is native, we need to unwrap WETH before sending it to the
  // recipient. This is because we only handle WETH in the destination swap.
  if (
    crossSwap.isOutputNative &&
    (crossSwap.type === AMOUNT_TYPE.EXACT_OUTPUT ||
      crossSwap.type === AMOUNT_TYPE.MIN_OUTPUT)
  ) {
    unwrapActions = [
      {
        target: crossSwap.outputToken.address,
        callData: encodeWethWithdrawCalldata(crossSwap.amount),
        value: "0",
      },
    ];
    transferActions = [
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
  } else if (crossSwap.type === AMOUNT_TYPE.EXACT_INPUT) {
    if (crossSwap.isOutputNative) {
      unwrapActions = [
        {
          target: crossSwap.outputToken.address,
          callData: encodeWethWithdrawCalldata(
            destinationSwapQuote.minAmountOut
          ),
          value: "0",
        },
      ];
      transferActions = [
        {
          target: crossSwap.recipient,
          callData: "0x",
          value: destinationSwapQuote.minAmountOut.toString(),
        },
      ];
    }
    transferActions = [
      ...transferActions,
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
    : destinationSwapQuote.swapTxns.map((swapTxn) => ({
        target: swapTxn.to,
        callData: swapTxn.data,
        value: swapTxn.value,
      }));

  const embeddedActions =
    crossSwap.embeddedActions && !isIndicativeQuote
      ? encodeActionCalls(crossSwap.embeddedActions, destinationSwapChainId)
      : [];

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
      // unwrap weth if output token is native
      ...unwrapActions,
      // transfer output tokens to recipient or execute destination actions
      ...(embeddedActions.length > 0 ? embeddedActions : transferActions),
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

export function getOriginSwapEntryPoints(
  originSwapEntryPointContractName: OriginEntryPointContractName,
  chainId: number,
  dex: SupportedDex
): OriginEntryPoints {
  if (originSwapEntryPointContractName === "SpokePoolPeriphery") {
    return {
      // The `SpokePoolPeriphery` contract is used to initiate an origin swap. It uses a
      // proxy-pattern for security reasons which requires us to use the `SwapProxy`
      // contract as the recipient for the origin swap.
      originSwapInitialRecipient: {
        name: "SwapProxy",
        address: getSwapProxyAddress(chainId),
      },
      swapAndBridge: {
        name: "SpokePoolPeriphery",
        address: getSpokePoolPeripheryAddress(chainId),
        dex,
      },
      deposit: {
        name: "SpokePoolPeriphery",
        address: getSpokePoolPeripheryAddress(chainId),
      },
    } as const;
  } else if (originSwapEntryPointContractName === "UniversalSwapAndBridge") {
    return {
      originSwapInitialRecipient: {
        name: "UniversalSwapAndBridge",
        address: getUniversalSwapAndBridgeAddress(dex, chainId),
      },
      swapAndBridge: {
        name: "UniversalSwapAndBridge",
        address: getUniversalSwapAndBridgeAddress(dex, chainId),
        dex,
      },
      deposit: {
        name: "SpokePool",
        address: getSpokePoolAddress(chainId),
      },
    } as const;
  }
  throw new Error(
    `Unknown origin swap entry point contract '${originSwapEntryPointContractName}'`
  );
}

/**
 * Estimates the input amount required for an exact output amount by using the
 * a single unit amount of the input token as a reference.
 *
 * @param swap - The swap object containing the tokenIn, tokenOut, amount, and slippageTolerance.
 * @param apiEndpoint - The API endpoint to use for the swap.
 * @param apiHeaders - The headers to use for the API request.
 * @returns The required input amount.
 */
export async function estimateInputForExactOutput(
  swap: Swap,
  apiEndpoint: string,
  apiHeaders: AxiosRequestHeaders
): Promise<string> {
  const inputUnit = BigNumber.from(10).pow(swap.tokenIn.decimals);

  const inputUnitResponse = await axios.get(apiEndpoint, {
    headers: apiHeaders,
    params: {
      chainId: swap.chainId,
      sellToken: swap.tokenIn.address,
      buyToken: swap.tokenOut.address,
      sellAmount: inputUnit.toString(),
      taker: swap.recipient,
      slippageBps: Math.floor(swap.slippageTolerance * 100),
    },
  });

  const inputUnitQuote = inputUnitResponse.data;
  const inputUnitOutputAmount = BigNumber.from(inputUnitQuote.buyAmount);

  // Estimate the required input amount for the desired output
  const desiredOutputAmount = BigNumber.from(swap.amount);
  const requiredInputAmount = desiredOutputAmount
    .mul(inputUnit)
    .div(inputUnitOutputAmount);

  // Add 1% buffer for slippage and rounding
  return requiredInputAmount.mul(101).div(100).toString();
}

export function isValidSource(
  _source: string,
  chainId: number,
  sources: DexSources
) {
  const sourceToCheck = _source.toLowerCase();
  return sources.sources[chainId].some((source) =>
    source.names.includes(sourceToCheck)
  );
}

export function makeGetSources(sources: DexSources) {
  return (
    chainId: number,
    opts?: {
      excludeSources?: string[];
      includeSources?: string[];
    }
  ) => {
    if (!opts || (!opts?.excludeSources && !opts?.includeSources)) {
      return undefined;
    }

    const filteredSources = opts?.excludeSources
      ? opts.excludeSources.filter((excludeSource) =>
          isValidSource(excludeSource, chainId, sources)
        )
      : opts.includeSources
        ? opts.includeSources.filter((includeSource) =>
            isValidSource(includeSource, chainId, sources)
          )
        : [];
    const sourcesKeys = Array.from(
      new Set(
        filteredSources.flatMap(
          (source) =>
            sources.sources[chainId].find((s) =>
              s.names.some(
                (name) => name.toLowerCase() === source.toLowerCase()
              )
            )?.key || []
        )
      )
    );

    return {
      sourcesKeys,
      sourcesType: opts?.excludeSources ? "exclude" : "include",
    } as const;
  };
}
