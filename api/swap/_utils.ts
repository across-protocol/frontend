import {
  assert,
  create,
  Infer,
  type,
  string,
  optional,
  enums,
  array,
  object,
  boolean,
  lazy,
  union,
  unknown,
  refine,
  defaulted,
} from "superstruct";
import { BigNumber, constants, utils } from "ethers";

import { TypedVercelRequest } from "../_types";
import {
  positiveFloatStr,
  positiveIntStr,
  validAddress,
  validEvmAddress,
  boolStr,
  getCachedTokenInfo,
  getWrappedNativeTokenAddress,
  getCachedTokenPrice,
  paramToArray,
} from "../_utils";
import { AbiEncodingError, InvalidParamError } from "../_errors";
import { isValidIntegratorId } from "../_integrator-id";
import {
  CrossSwapFees,
  CrossSwapQuotes,
  SwapQuote,
  Token,
  AmountType,
} from "../_dexes/types";
import { AMOUNT_TYPE, CrossSwapType } from "../_dexes/utils";
import {
  encodeApproveCalldata,
  encodeDrainCalldata,
  encodeMakeCallWithBalanceCalldata,
  getMultiCallHandlerAddress,
} from "../_multicall-handler";

export const BaseSwapQueryParamsSchema = type({
  amount: positiveIntStr(),
  tradeType: optional(enums(["minOutput", "exactOutput", "exactInput"])),
  inputToken: validAddress(),
  outputToken: validAddress(),
  originChainId: positiveIntStr(),
  destinationChainId: positiveIntStr(),
  depositor: validAddress(),
  recipient: optional(validAddress()),
  integratorId: optional(string()),
  refundAddress: optional(validAddress()),
  refundOnOrigin: optional(boolStr()),
  slippageTolerance: optional(positiveFloatStr(50)), // max. 50% slippage
  skipOriginTxEstimation: optional(boolStr()),
  excludeSources: optional(union([array(string()), string()])),
  includeSources: optional(union([array(string()), string()])),
});

export type BaseSwapQueryParams = Infer<typeof BaseSwapQueryParamsSchema>;

export async function handleBaseSwapQueryParams(
  query: TypedVercelRequest<BaseSwapQueryParams>["query"]
) {
  assert(query, BaseSwapQueryParamsSchema);

  const {
    inputToken: _inputTokenAddress,
    outputToken: _outputTokenAddress,
    originChainId: _originChainId,
    destinationChainId: _destinationChainId,
    amount: _amount,
    tradeType = AMOUNT_TYPE.EXACT_INPUT,
    recipient,
    depositor,
    integratorId,
    refundAddress,
    refundOnOrigin: _refundOnOrigin = "true",
    slippageTolerance = "1", // Default to 1% slippage
    skipOriginTxEstimation: _skipOriginTxEstimation = "false",
    excludeSources: _excludeSources,
    includeSources: _includeSources,
  } = query;

  const originChainId = Number(_originChainId);
  const destinationChainId = Number(_destinationChainId);
  const refundOnOrigin = _refundOnOrigin === "true";
  const skipOriginTxEstimation = _skipOriginTxEstimation === "true";
  const isInputNative = _inputTokenAddress === constants.AddressZero;
  const isOutputNative = _outputTokenAddress === constants.AddressZero;
  const inputTokenAddress = isInputNative
    ? getWrappedNativeTokenAddress(originChainId)
    : utils.getAddress(_inputTokenAddress);
  const outputTokenAddress = isOutputNative
    ? getWrappedNativeTokenAddress(destinationChainId)
    : utils.getAddress(_outputTokenAddress);
  const excludeSources = _excludeSources
    ? paramToArray(_excludeSources)
    : undefined;
  const includeSources = _includeSources
    ? paramToArray(_includeSources)
    : undefined;

  if (excludeSources && includeSources) {
    throw new InvalidParamError({
      param: "excludeSources, includeSources",
      message:
        "Cannot use 'excludeSources' and 'includeSources' together. Please use only one of them.",
    });
  }

  if (integratorId && !isValidIntegratorId(integratorId)) {
    throw new InvalidParamError({
      param: "integratorId",
      message: "Invalid integrator ID. Needs to be 2 bytes hex string.",
    });
  }

  if (!inputTokenAddress || !outputTokenAddress) {
    throw new InvalidParamError({
      param: "inputToken, outputToken",
      message: "Invalid input or output token address",
    });
  }

  if (integratorId && !isValidIntegratorId(integratorId)) {
    throw new InvalidParamError({
      param: "integratorId",
      message: "Invalid integrator ID. Needs to be 2 bytes hex string.",
    });
  }

  const amountType = tradeType as AmountType;
  const amount = BigNumber.from(_amount);

  const [inputToken, outputToken] = await Promise.all([
    getCachedTokenInfo({
      address: inputTokenAddress,
      chainId: originChainId,
    }),
    getCachedTokenInfo({
      address: outputTokenAddress,
      chainId: destinationChainId,
    }),
  ]);

  return {
    inputToken,
    outputToken,
    amount,
    amountType,
    refundOnOrigin,
    integratorId,
    skipOriginTxEstimation,
    isInputNative,
    isOutputNative,
    refundAddress,
    recipient,
    depositor,
    slippageTolerance,
    excludeSources,
    includeSources,
  };
}

// Schema definitions for embedded actions
// Input param for a function call
const ActionArg = refine(
  object({
    value: unknown(), // Will be validated at runtime
    populateDynamically: optional(boolean()),
    balanceSource: optional(validEvmAddress()),
  }),
  "balanceSource",
  (argument) => {
    if (argument.populateDynamically && !argument.balanceSource) {
      return "balanceSource is required when populateDynamically is true";
    }
    return true;
  }
);

// Recursive array type that can have nested arrays at any depth
// Needed to support arguments of type tuple and array
const RecursiveArgumentArray: any = lazy(() =>
  union([ActionArg, array(RecursiveArgumentArray)])
);

// Instructions for a single function call
const Action = type({
  target: validEvmAddress(),
  functionSignature: string(), // Will be validated at runtime
  isNativeTransfer: defaulted(boolean(), false),
  args: array(RecursiveArgumentArray),
  value: defaulted(positiveIntStr(), "0"),
  populateCallValueDynamically: defaulted(boolean(), false),
});

export type Action = Infer<typeof Action>;

const SwapBody = type({
  actions: array(Action),
});

export type SwapBody = Infer<typeof SwapBody>;

export function handleSwapBody(body: SwapBody, destinationChainId: number) {
  // Validate rules for each action. We have to validate the input before default values are applied.
  body.actions?.forEach((action, index) => {
    // 1. Validate that value is provided when populateCallValueDynamically is false or omitted
    if (!action.populateCallValueDynamically && !action.value) {
      throw new InvalidParamError({
        param: `body.actions[${index}].value`,
        message:
          "value is required when populateCallValueDynamically is false or omitted",
      });
    }
    // 2. Validate that no function signature or args are provided when isNativeTransfer is true
    if (
      action.isNativeTransfer &&
      (action.functionSignature !== "" || action.args.length > 0)
    ) {
      throw new InvalidParamError({
        param: `body.actions[${index}].functionSignature, body.actions[${index}].args`,
        message:
          "function signature or args are not allowed when isNativeTransfer is true",
      });
    }
  });

  const parsedBody = create(body, SwapBody);
  // Assert that provided actions can be encoded
  encodeActionCalls(parsedBody.actions, destinationChainId);
  return parsedBody;
}

/**
 * Validates that provided actions can be properly encoded.
 * Recursively extracts argument values and validates they match the function signature.
 *
 * @throws {AbiEncodingError} When function encoding fails due to invalid arguments or mismatched signatures
 */
export function encodeActionCalls(actions: Action[], targetChainId: number) {
  // Helper function to recursively extract only the .value fields from args array
  const flattenArgs = (args: any[], depth: number = 0): any[] => {
    if (depth > 10) {
      throw new Error("Arguments array is too deeply nested");
    }
    return args.map((arg) => {
      if (Array.isArray(arg)) {
        return flattenArgs(arg, depth + 1);
      } else if (arg && typeof arg === "object" && "value" in arg) {
        // Fields to be populated dynamically must be zeroed out
        return arg.populateDynamically ? "0" : arg.value;
      } else {
        return arg;
      }
    });
  };

  return actions.map((action) => {
    const isNativeTransfer = action.isNativeTransfer;
    const populateCallValueDynamically = action.populateCallValueDynamically;
    if (isNativeTransfer) {
      if (populateCallValueDynamically) {
        // If action is a native transfer and populateCallValueDynamically is true
        // we can use a drain call to send all native balance to the target address
        return {
          target: getMultiCallHandlerAddress(targetChainId),
          callData: encodeDrainCalldata(constants.AddressZero, action.target),
          value: "0",
        };
      }
      // Otherwise we send the provided value to the target address
      return {
        target: action.target,
        callData: "0x",
        value: action.value,
      };
    } else {
      const methodAbi = action.functionSignature;
      const positionalArgs = flattenArgs(action.args);
      const iface = new utils.Interface([methodAbi]);
      const functionName = iface.fragments[0].name;
      const populateArgsDynamically = action.args.some(
        (arg) => arg.populateDynamically
      );

      try {
        const callData = iface.encodeFunctionData(functionName, positionalArgs);
        if (populateArgsDynamically || populateCallValueDynamically) {
          // If any argument or msg.value should be populated dynamically,
          // we have to wrap the call with makeCallWithBalance
          return getWrappedCallForMakeCallWithBalance(
            action,
            callData,
            populateCallValueDynamically,
            targetChainId
          );
        } else {
          // Otherwise we call the specified function with the provided args and value
          return {
            target: action.target,
            callData,
            value: action.value,
          };
        }
      } catch (err) {
        throw new AbiEncodingError(
          {
            message: `Failed to encode function data for ${functionName}. Arguments may be invalid or mismatched.`,
          },
          {
            cause: `${err instanceof Error ? err.message : String(err)}`,
          }
        );
      }
    }
  });
}

/**
 * Wraps contract calls with `makeCallWithBalance` to inject token or native balances dynamically.
 *
 * makeCallWithBalance takes the calldata to execute and a list of replacement instructions.
 * For each replacement instruction, it:
 * - Reads the current balance of the specified token (or native token when using zero address).
 * - Overwrites the specified byte offset in the calldata with the balance.
 * - For native token, it also sets `msg.value = balance`.
 *
 * Calldata offsets must point to zeroed-out regions, allowing safe in-place modification.
 *
 * @param action Contains the target address, function signature, args and value.
 * @param callData ABI-encoded function call to be modified.
 * @param populateCallValueDynamically Whether to inject the full native balance as msg.value.
 * @param targetChainId Destination chain id. Needed to get the MulticallHandler address.
 * @returns ABI-encoded input for calling `makeCallWithBalance`.
 */
export function getWrappedCallForMakeCallWithBalance(
  action: Action,
  callData: string,
  populateCallValueDynamically: boolean,
  targetChainId: number
) {
  // Create replacement instructions for arguments marked for dynamic population
  const replacements = action.args
    .map((arg, index) => {
      if (arg.populateDynamically) {
        return {
          token: arg.balanceSource,
          // Arguments start at byte 4 (after the 4-byte function selector)
          // And each argument is 32 bytes long
          offset: 4 + index * 32,
        };
      }
    })
    .filter((replacement) => replacement !== undefined);

  // Handle native balance injection if needed
  if (populateCallValueDynamically) {
    // If only msg.value needs to be injected, append 32 zeroed bytes to the calldata
    // and point the replacement to those extra bytes.
    // This prevents the MulticallHandler from corrupting actual function parameters
    // as the extra bytes are ignored during execution.
    const paddingToReplace = constants.HashZero.slice(2); // 32 zeroed bytes, remove the 0x prefix
    callData = callData + paddingToReplace;
    replacements.push({
      token: constants.AddressZero, // Use zeroAddress to replace msg.value with native balance
      offset: 4 + action.args.length * 32, // Set the replacement offset to point to the extra bytes
    });
  }

  const wrappedCall = encodeMakeCallWithBalanceCalldata(
    action.target,
    callData,
    action.value,
    replacements
  );

  return {
    target: getMultiCallHandlerAddress(targetChainId),
    callData: wrappedCall,
    value: "0", // Value for this call is already included in the wrapped call
  };
}

export function getApprovalTxns(params: {
  allowance: BigNumber;
  token: Token;
  spender: string;
  amount: BigNumber;
}) {
  const approvalTxns: {
    chainId: number;
    to: string;
    data: string;
  }[] = [];
  // USDT has a different approval flow when changing an already approve amount.
  // We need to set the allowance to 0 first.
  // See https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7#code#L201
  if (params.token.symbol === "USDT" && params.allowance.gt(0)) {
    approvalTxns.push({
      chainId: params.token.chainId,
      to: params.token.address,
      data: encodeApproveCalldata(params.spender, BigNumber.from(0)),
    });
  }
  approvalTxns.push({
    chainId: params.token.chainId,
    to: params.token.address,
    data: encodeApproveCalldata(params.spender, params.amount),
  });
  return approvalTxns;
}

async function calculateSwapFee(
  swapQuote: SwapQuote,
  baseCurrency: string
): Promise<Record<string, number>> {
  const { tokenIn, tokenOut, expectedAmountOut, expectedAmountIn } = swapQuote;
  const [inputTokenPriceBase, outputTokenPriceBase] = await Promise.all([
    getCachedTokenPrice(
      tokenIn.address,
      baseCurrency,
      undefined,
      tokenIn.chainId
    ),
    getCachedTokenPrice(
      tokenOut.address,
      baseCurrency,
      undefined,
      tokenOut.chainId
    ),
  ]);

  const normalizedIn =
    parseFloat(utils.formatUnits(expectedAmountIn, tokenIn.decimals)) *
    inputTokenPriceBase;
  const normalizedOut =
    parseFloat(utils.formatUnits(expectedAmountOut, tokenOut.decimals)) *
    outputTokenPriceBase;
  return {
    [baseCurrency]: normalizedIn - normalizedOut,
  };
}

async function calculateBridgeFee(
  bridgeQuote: CrossSwapQuotes["bridgeQuote"],
  baseCurrency: string
): Promise<Record<string, number>> {
  const { inputToken, suggestedFees } = bridgeQuote;
  const inputTokenPriceBase = await getCachedTokenPrice(
    inputToken.address,
    baseCurrency,
    undefined,
    inputToken.chainId
  );
  const normalizedFee =
    parseFloat(
      utils.formatUnits(suggestedFees.totalRelayFee.total, inputToken.decimals)
    ) * inputTokenPriceBase;

  return {
    [baseCurrency]: normalizedFee,
  };
}

export async function calculateCrossSwapFees(
  crossSwapQuote: CrossSwapQuotes,
  baseCurrency = "usd"
): Promise<CrossSwapFees> {
  const bridgeFeePromise = calculateBridgeFee(
    crossSwapQuote.bridgeQuote,
    baseCurrency
  );

  const originSwapFeePromise = crossSwapQuote?.originSwapQuote
    ? calculateSwapFee(crossSwapQuote.originSwapQuote, baseCurrency)
    : Promise.resolve(undefined);

  const destinationSwapFeePromise = crossSwapQuote?.destinationSwapQuote
    ? calculateSwapFee(crossSwapQuote.destinationSwapQuote, baseCurrency)
    : Promise.resolve(undefined);

  const [bridgeFees, originSwapFees, destinationSwapFees] = await Promise.all([
    bridgeFeePromise,
    originSwapFeePromise,
    destinationSwapFeePromise,
  ]);

  return {
    bridgeFees,
    originSwapFees,
    destinationSwapFees,
  };
}

export function stringifyBigNumProps<T extends object | any[]>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((element) => {
      if (element instanceof BigNumber) {
        return element.toString();
      }
      if (typeof element === "object" && element !== null) {
        return stringifyBigNumProps(element);
      }
      return element;
    }) as T;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => {
      if (val instanceof BigNumber) {
        return [key, val.toString()];
      }
      if (typeof val === "object" && val !== null) {
        return [key, stringifyBigNumProps(val)];
      }
      return [key, val];
    })
  ) as T;
}

export function buildBaseSwapResponseJson(params: {
  crossSwapType: CrossSwapType;
  amountType: AmountType;
  amount: BigNumber;
  inputTokenAddress: string;
  originChainId: number;
  inputAmount: BigNumber;
  allowance: BigNumber;
  balance: BigNumber;
  approvalTxns?: {
    to: string;
    data: string;
  }[];
  originSwapQuote?: SwapQuote;
  bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  destinationSwapQuote?: SwapQuote;
  refundOnOrigin: boolean;
  approvalSwapTx?: {
    from: string;
    to: string;
    data: string;
    value?: BigNumber;
    gas?: BigNumber;
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
  };
  permitSwapTx?: any; // TODO: Add type
}) {
  const refundToken = params.refundOnOrigin
    ? params.bridgeQuote.inputToken
    : params.bridgeQuote.outputToken;
  return stringifyBigNumProps({
    crossSwapType: params.crossSwapType,
    amountType: params.amountType,
    checks: {
      allowance: params.approvalSwapTx
        ? {
            token: params.inputTokenAddress,
            spender: params.approvalSwapTx.to,
            actual: params.allowance,
            expected: params.inputAmount,
          }
        : // TODO: Handle permit2 required allowance
          {
            token: params.inputTokenAddress,
            spender: constants.AddressZero,
            actual: 0,
            expected: 0,
          },
      balance: {
        token: params.inputTokenAddress,
        actual: params.balance,
        expected: params.inputAmount,
      },
    },
    approvalTxns: params.approvalTxns,
    steps: {
      originSwap: params.originSwapQuote
        ? {
            tokenIn: params.originSwapQuote.tokenIn,
            tokenOut: params.originSwapQuote.tokenOut,
            inputAmount: params.originSwapQuote.expectedAmountIn,
            outputAmount: params.originSwapQuote.expectedAmountOut,
            minOutputAmount: params.originSwapQuote.minAmountOut,
            maxInputAmount: params.originSwapQuote.maximumAmountIn,
            swapProvider: params.originSwapQuote.swapProvider,
          }
        : undefined,
      bridge: {
        inputAmount: params.bridgeQuote.inputAmount,
        outputAmount: params.bridgeQuote.outputAmount,
        tokenIn: params.bridgeQuote.inputToken,
        tokenOut: params.bridgeQuote.outputToken,
        fees: {
          totalRelay: params.bridgeQuote.suggestedFees.totalRelayFee,
          relayerCapital: params.bridgeQuote.suggestedFees.relayerCapitalFee,
          relayerGas: params.bridgeQuote.suggestedFees.relayerGasFee,
          lp: params.bridgeQuote.suggestedFees.lpFee,
        },
      },
      destinationSwap: params.destinationSwapQuote
        ? {
            tokenIn: params.destinationSwapQuote.tokenIn,
            tokenOut: params.destinationSwapQuote.tokenOut,
            inputAmount: params.destinationSwapQuote.expectedAmountIn,
            maxInputAmount: params.destinationSwapQuote.maximumAmountIn,
            outputAmount: params.destinationSwapQuote.expectedAmountOut,
            minOutputAmount: params.destinationSwapQuote.minAmountOut,
            swapProvider: params.destinationSwapQuote.swapProvider,
          }
        : undefined,
    },
    inputToken:
      params.originSwapQuote?.tokenIn ?? params.bridgeQuote.inputToken,
    outputToken:
      params.destinationSwapQuote?.tokenOut ?? params.bridgeQuote.outputToken,
    refundToken:
      refundToken.symbol === "ETH"
        ? {
            ...refundToken,
            symbol: "WETH",
          }
        : refundToken,
    inputAmount:
      params.amountType === "exactInput"
        ? params.amount
        : (params.originSwapQuote?.expectedAmountIn ??
          params.bridgeQuote.inputAmount),
    expectedOutputAmount:
      params.amountType === "exactOutput"
        ? params.amount
        : (params.destinationSwapQuote?.expectedAmountOut ??
          params.bridgeQuote.outputAmount),
    minOutputAmount:
      params.amountType === "exactOutput"
        ? params.amount
        : (params.destinationSwapQuote?.minAmountOut ??
          params.bridgeQuote.outputAmount),
    expectedFillTime: params.bridgeQuote.suggestedFees.estimatedFillTimeSec,
    swapTx: params.approvalSwapTx
      ? {
          simulationSuccess: !!params.approvalSwapTx.gas,
          chainId: params.originChainId,
          to: params.approvalSwapTx.to,
          data: params.approvalSwapTx.data,
          value: params.approvalSwapTx.value,
          gas: params.approvalSwapTx.gas,
          maxFeePerGas: params.approvalSwapTx.maxFeePerGas,
          maxPriorityFeePerGas: params.approvalSwapTx.maxPriorityFeePerGas,
        }
      : params.permitSwapTx
        ? params.permitSwapTx.swapTx
        : undefined,
    eip712: params.permitSwapTx?.eip712,
  });
}
