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
import { BigNumber, constants, ethers, utils } from "ethers";
import * as sdk from "@across-protocol/sdk";

import { TypedVercelRequest } from "../_types";
import {
  positiveFloatStr,
  positiveIntStr,
  validAddress,
  validEvmAddress,
  boolStr,
  getCachedTokenInfo,
  getWrappedNativeTokenAddress,
  paramToArray,
  getChainInfo,
  getCachedTokenPrice,
  ConvertDecimals,
  isOutputTokenBridgeable,
} from "../_utils";
import { AbiEncodingError, InvalidParamError } from "../_errors";
import { isValidIntegratorId } from "../_integrator-id";
import {
  CrossSwapQuotes,
  SwapQuote,
  Token,
  AmountType,
  IndirectDestinationRoute,
} from "../_dexes/types";
import {
  AMOUNT_TYPE,
  AppFee,
  CROSS_SWAP_TYPE,
  CrossSwapType,
} from "../_dexes/utils";
import {
  encodeApproveCalldata,
  encodeDrainCalldata,
  encodeMakeCallWithBalanceCalldata,
  getMultiCallHandlerAddress,
} from "../_multicall-handler";
import { TOKEN_SYMBOLS_MAP } from "../_constants";
import { Logger } from "@across-protocol/sdk/dist/types/relayFeeCalculator";

const PRICE_DIFFERENCE_TOLERANCE = 0.01;

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
  // DEPRECATED: Use `slippage` instead
  slippageTolerance: optional(positiveFloatStr(50)), // max. 50% slippage
  slippage: optional(positiveFloatStr(0.5)), // max. 50% slippage
  skipOriginTxEstimation: optional(boolStr()),
  excludeSources: optional(union([array(string()), string()])),
  includeSources: optional(union([array(string()), string()])),
  appFee: optional(positiveFloatStr(1)),
  appFeeRecipient: optional(validAddress()),
  strictTradeType: optional(boolStr()),
  skipChecks: optional(boolStr()),
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
    slippageTolerance,
    slippage = "0.01", // Default to 1% slippage
    skipOriginTxEstimation: _skipOriginTxEstimation = "false",
    excludeSources: _excludeSources,
    includeSources: _includeSources,
    appFee,
    appFeeRecipient,
    strictTradeType: _strictTradeType = "true",
    skipChecks: _skipChecks = "false",
  } = query;

  const originChainId = Number(_originChainId);
  const destinationChainId = Number(_destinationChainId);
  const refundOnOrigin = _refundOnOrigin === "true";
  const skipOriginTxEstimation = _skipOriginTxEstimation === "true";
  const skipChecks = _skipChecks === "true";
  const strictTradeType = _strictTradeType === "true";
  const isInputNative = _inputTokenAddress === constants.AddressZero;
  const isOutputNative = _outputTokenAddress === constants.AddressZero;
  const isDestinationSvm = sdk.utils.chainIsSvm(destinationChainId);
  const isOriginSvm = sdk.utils.chainIsSvm(originChainId);

  const inputTokenAddress = isInputNative
    ? getWrappedNativeTokenAddress(originChainId)
    : sdk.utils.toAddressType(_inputTokenAddress, originChainId).toNative();
  const outputTokenAddress = isOutputNative
    ? getWrappedNativeTokenAddress(destinationChainId)
    : sdk.utils
        .toAddressType(_outputTokenAddress, destinationChainId)
        .toNative();
  const excludeSources = _excludeSources
    ? paramToArray(_excludeSources)
    : undefined;
  const includeSources = _includeSources
    ? paramToArray(_includeSources)
    : undefined;

  if (isOriginSvm || isDestinationSvm) {
    if (!recipient) {
      throw new InvalidParamError({
        param: "recipient",
        message: "Recipient is required for routes involving Solana",
      });
    }

    if (appFee || appFeeRecipient) {
      throw new InvalidParamError({
        param: "appFee, appFeeRecipient",
        message: "App fee is not supported for routes involving Solana",
      });
    }

    // Restrict SVM ↔ EVM combinations that require a destination swap
    const outputBridgeable = isOutputTokenBridgeable(
      outputTokenAddress,
      originChainId,
      destinationChainId
    );

    if (!outputBridgeable) {
      throw new InvalidParamError({
        param: "outputToken",
        message:
          "Destination swaps are not supported yet for routes involving Solana.",
      });
    }
  }

  if (excludeSources && includeSources) {
    throw new InvalidParamError({
      param: "excludeSources, includeSources",
      message:
        "Cannot use 'excludeSources' and 'includeSources' together. Please use only one of them.",
    });
  }

  // Validate that both app fee parameters are provided together
  if ((appFee && !appFeeRecipient) || (!appFee && appFeeRecipient)) {
    throw new InvalidParamError({
      param: "appFee, appFeeRecipient",
      message:
        "Both 'appFee' and 'appFeeRecipient' must be provided together, or neither should be provided.",
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

  const slippageToleranceNum = slippageTolerance
    ? parseFloat(slippageTolerance)
    : undefined;
  const slippageNum = parseFloat(slippage);
  const appFeeNum = appFee ? parseFloat(appFee) : undefined;

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
    slippageTolerance: slippageToleranceNum,
    slippage: slippageNum,
    excludeSources,
    includeSources,
    appFeePercent: appFeeNum,
    appFeeRecipient,
    strictTradeType,
    skipChecks,
    isDestinationSvm,
    isOriginSvm,
  };
}

// Schema definitions for embedded actions
// Input param for a function call
const ActionArg = refine(
  object({
    value: unknown(), // Will be validated at runtime
    populateDynamically: optional(boolean()),
    balanceSourceToken: optional(validEvmAddress()),
  }),
  "balanceSourceToken",
  (argument) => {
    if (argument.populateDynamically && !argument.balanceSourceToken) {
      return "balanceSourceToken is required when populateDynamically is true";
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
  functionSignature: defaulted(string(), ""), // Will be validated at runtime
  isNativeTransfer: defaulted(boolean(), false),
  args: defaulted(array(RecursiveArgumentArray), []),
  value: defaulted(positiveIntStr(), "0"),
  populateCallValueDynamically: defaulted(boolean(), false),
});

export type Action = Infer<typeof Action>;

const SwapBody = type({
  actions: array(Action),
});

export type SwapBody = Infer<typeof SwapBody>;

export function handleSwapBody(
  body: SwapBody,
  destinationChainId: number,
  originChainId: number
) {
  // Disable actions when origin or destination is SVM
  if (
    sdk.utils.chainIsSvm(originChainId) ||
    sdk.utils.chainIsSvm(destinationChainId)
  ) {
    if (body.actions && body.actions.length > 0) {
      throw new InvalidParamError({
        param: "actions",
        message: "Actions are not supported yet for routes involving Solana.",
      });
    }
  }

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

    // 2. Validate isNativeTransfer rules
    if (action.isNativeTransfer) {
      // When isNativeTransfer is true, functionSignature and args must be empty
      if (
        (action.functionSignature && action.functionSignature !== "") ||
        (action.args && action.args.length > 0)
      ) {
        throw new InvalidParamError({
          param: `body.actions[${index}].functionSignature, body.actions[${index}].args`,
          message:
            "function signature or args are not allowed when isNativeTransfer is true",
        });
      }
    } else {
      // When isNativeTransfer is false, functionSignature is required
      if (!action.functionSignature || action.functionSignature === "") {
        throw new InvalidParamError({
          param: `body.actions[${index}].functionSignature`,
          message:
            "functionSignature is required when isNativeTransfer is false or omitted",
        });
      }
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
      } else if (arg && typeof arg === "object") {
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
      let iface: utils.Interface;
      let functionName: string;

      const methodAbi = action.functionSignature;
      const positionalArgs = flattenArgs(action.args);
      const populateArgsDynamically = action.args.some(
        (arg) => arg.populateDynamically
      );

      try {
        iface = new utils.Interface([methodAbi]);
        functionName = iface.fragments[0].name;
      } catch (err) {
        throw new AbiEncodingError(
          {
            message: `Failed to encode function data for ABI '${methodAbi}'. Function signature may be invalid.`,
          },
          {
            cause: `${err instanceof Error ? err.message : String(err)}`,
          }
        );
      }

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
          token: arg.balanceSourceToken,
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

export function stringifyBigNumProps<T extends object | any[]>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((element) => {
      if (
        element instanceof BigNumber ||
        (element && typeof element === "object" && element._isBigNumber)
      ) {
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
      if (
        val instanceof BigNumber ||
        (val && typeof val === "object" && val._isBigNumber)
      ) {
        return [key, val.toString()];
      }
      if (typeof val === "object" && val !== null) {
        return [key, stringifyBigNumProps(val)];
      }
      return [key, val];
    })
  ) as T;
}

/**
 * Helper function to format fee components with consistent structure
 * @param amount - Fee amount in token units (BigNumber)
 * @param amountUsd - Fee amount in USD
 * @param token - Token information
 * @param inputAmountUsd - Total input amount in USD (for percentage calculation). Omit to exclude pct field.
 * @returns Formatted fee object with amount, amountUsd, pct (if inputAmountUsd provided), and token
 */
function formatFeeComponent(params: {
  amount: BigNumber;
  amountUsd: number;
  token: Token;
  inputAmountUsd?: number;
}) {
  const DEFAULT_PRECISION = 18;
  const { amount, amountUsd, token, inputAmountUsd } = params;

  const result: {
    amount: BigNumber;
    amountUsd: string;
    pct?: BigNumber;
    token: Token;
  } = {
    amount,
    amountUsd: ethers.utils.formatEther(
      ethers.utils.parseEther(amountUsd.toFixed(DEFAULT_PRECISION))
    ),
    token,
  };

  if (inputAmountUsd !== undefined) {
    result.pct = ethers.utils.parseEther(
      (amountUsd / inputAmountUsd).toFixed(DEFAULT_PRECISION)
    );
  }

  return result;
}

export async function calculateSwapFees(params: {
  inputAmount: BigNumber;
  originSwapQuote?: SwapQuote;
  bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  destinationSwapQuote?: SwapQuote;
  appFeePercent?: number;
  appFee?: AppFee;
  originTxGas?: BigNumber;
  originTxGasPrice?: BigNumber;
  inputTokenPriceUsd: number;
  outputTokenPriceUsd: number;
  originNativePriceUsd: number;
  destinationNativePriceUsd: number;
  bridgeQuoteInputTokenPriceUsd: number;
  appFeeTokenPriceUsd: number;
  minOutputAmountSansAppFees: BigNumber;
  originChainId: number;
  destinationChainId: number;
  indirectDestinationRoute?: IndirectDestinationRoute;
  logger: Logger;
}) {
  const {
    inputAmount,
    originSwapQuote,
    bridgeQuote,
    destinationSwapQuote,
    appFee,
    originTxGas,
    originTxGasPrice,
    inputTokenPriceUsd: _inputTokenPriceUsd,
    outputTokenPriceUsd: _outputTokenPriceUsd,
    originNativePriceUsd,
    destinationNativePriceUsd,
    bridgeQuoteInputTokenPriceUsd,
    appFeeTokenPriceUsd,
    minOutputAmountSansAppFees,
    originChainId,
    destinationChainId,
    indirectDestinationRoute,
    logger,
  } = params;

  try {
    if (
      _inputTokenPriceUsd === 0 ||
      _outputTokenPriceUsd === 0 ||
      originNativePriceUsd === 0 ||
      destinationNativePriceUsd === 0 ||
      bridgeQuoteInputTokenPriceUsd === 0
    ) {
      logger.debug({
        at: "calculateSwapFees",
        message: "Error calculating swap fees. Could not resolve USD prices.",
        _inputTokenPriceUsd,
        _outputTokenPriceUsd,
        originNativePriceUsd,
        destinationNativePriceUsd,
        bridgeQuoteInputTokenPriceUsd,
      });
      return {};
    }

    const inputToken = originSwapQuote?.tokenIn ?? bridgeQuote.inputToken;
    const outputToken =
      destinationSwapQuote?.tokenOut ?? bridgeQuote.outputToken;

    const priceDifference = Math.abs(
      _inputTokenPriceUsd - _outputTokenPriceUsd
    );
    const priceDifferencePercentage = priceDifference / _inputTokenPriceUsd;

    let inputTokenPriceUsd = _inputTokenPriceUsd;
    let outputTokenPriceUsd = _outputTokenPriceUsd;

    if (
      inputToken.symbol === outputToken.symbol &&
      (priceDifferencePercentage > PRICE_DIFFERENCE_TOLERANCE ||
        outputTokenPriceUsd > inputTokenPriceUsd)
    ) {
      [inputTokenPriceUsd, outputTokenPriceUsd] = await Promise.all([
        getCachedTokenPrice({
          symbol: inputToken.symbol,
          tokenAddress: inputToken.address,
          chainId: inputToken.chainId,
          fallbackResolver: "lifi",
        }),
        getCachedTokenPrice({
          symbol: outputToken.symbol,
          tokenAddress: outputToken.address,
          chainId: outputToken.chainId,
          fallbackResolver: "lifi",
        }),
      ]);

      if (
        priceDifferencePercentage > PRICE_DIFFERENCE_TOLERANCE ||
        outputTokenPriceUsd > inputTokenPriceUsd ||
        outputTokenPriceUsd === 0 ||
        inputTokenPriceUsd === 0
      ) {
        logger.debug({
          at: "calculateSwapFees",
          message:
            "Error calculating swap fees. USD prices are not consistent.",
          _inputTokenPriceUsd,
          _outputTokenPriceUsd,
          inputTokenPriceUsd,
          outputTokenPriceUsd,
        });
        return {};
      }
    }

    const originGas =
      originTxGas && originTxGasPrice
        ? originTxGas.mul(originTxGasPrice)
        : BigNumber.from(0);

    const appFeeAmount = appFee?.feeAmount || BigNumber.from(0);
    const appFeeToken = appFee?.feeToken || outputToken;
    const appFeeUsd =
      parseFloat(utils.formatUnits(appFeeAmount, appFeeToken.decimals)) *
      appFeeTokenPriceUsd;

    const bridgeFees = bridgeQuote.fees;
    const relayerCapital = bridgeFees.relayerCapital;
    const destinationGas = bridgeFees.relayerGas;
    const lpFee = bridgeFees.lp;
    const relayerTotal = bridgeFees.totalRelay;
    const bridgeFee = bridgeFees.bridgeFee;

    const originGasToken = getNativeTokenInfo(originChainId);
    const destinationGasToken = getNativeTokenInfo(
      indirectDestinationRoute?.intermediaryOutputToken.chainId ??
        destinationChainId
    );

    // Get USD price for bridge fee token
    // Skip price fetch if bridge fee is zero
    const bridgeFeeTokenPriceUsd = bridgeFee.total.isZero()
      ? 0
      : bridgeFee.token.chainId === originChainId &&
          bridgeFee.token.symbol === originGasToken.symbol
        ? originNativePriceUsd
        : await getCachedTokenPrice({
            symbol: bridgeFee.token.symbol,
            tokenAddress: bridgeFee.token.address,
            chainId: bridgeFee.token.chainId,
          });

    // Calculate USD amounts
    const originGasUsd =
      parseFloat(utils.formatUnits(originGas, originGasToken.decimals)) *
      originNativePriceUsd;
    // We need to use bridge input token price for destination gas since
    // suggested fees returns the gas total in input token decimals
    const destinationGasUsd =
      parseFloat(
        utils.formatUnits(destinationGas.total, bridgeQuote.inputToken.decimals)
      ) * bridgeQuoteInputTokenPriceUsd;
    const relayerCapitalUsd =
      parseFloat(
        utils.formatUnits(relayerCapital.total, bridgeQuote.inputToken.decimals)
      ) * bridgeQuoteInputTokenPriceUsd;
    const lpFeeUsd =
      parseFloat(
        utils.formatUnits(lpFee.total, bridgeQuote.inputToken.decimals)
      ) * bridgeQuoteInputTokenPriceUsd;
    const relayerTotalUsd =
      parseFloat(
        utils.formatUnits(relayerTotal.total, bridgeQuote.inputToken.decimals)
      ) * bridgeQuoteInputTokenPriceUsd;
    const bridgeFeeUsd =
      parseFloat(utils.formatUnits(bridgeFee.total, bridgeFee.token.decimals)) *
      bridgeFeeTokenPriceUsd;
    const inputAmountUsd =
      parseFloat(utils.formatUnits(inputAmount, inputToken.decimals)) *
      inputTokenPriceUsd;
    const outputMinAmountSansAppFeesUsd =
      parseFloat(
        utils.formatUnits(
          minOutputAmountSansAppFees,
          indirectDestinationRoute?.outputToken.decimals ?? outputToken.decimals
        )
      ) * outputTokenPriceUsd;

    const totalFeeUsd = inputAmountUsd - outputMinAmountSansAppFeesUsd;
    const totalFeePct = totalFeeUsd / inputAmountUsd;
    const totalFeeAmount = inputAmount
      .mul(utils.parseEther(totalFeePct.toFixed(18)))
      .div(sdk.utils.fixedPointAdjustment);

    return {
      total: formatFeeComponent({
        amount: totalFeeAmount,
        amountUsd: totalFeeUsd,
        token: inputToken,
        inputAmountUsd,
      }),
      originGas: formatFeeComponent({
        amount: originGas,
        amountUsd: originGasUsd,
        token: originGasToken,
      }),
      destinationGas: formatFeeComponent({
        amount: safeUsdToTokenAmount(
          destinationGasUsd,
          destinationNativePriceUsd,
          destinationGasToken.decimals
        ),
        amountUsd: destinationGasUsd,
        token: destinationGasToken,
        inputAmountUsd,
      }),
      relayerCapital: formatFeeComponent({
        amount: relayerCapital.total,
        amountUsd: relayerCapitalUsd,
        token: bridgeQuote.inputToken,
        inputAmountUsd,
      }),
      lpFee: formatFeeComponent({
        amount: lpFee.total,
        amountUsd: lpFeeUsd,
        token: bridgeQuote.inputToken,
        inputAmountUsd,
      }),
      relayerTotal: formatFeeComponent({
        amount: relayerTotal.total,
        amountUsd: relayerTotalUsd,
        token: bridgeQuote.inputToken,
        inputAmountUsd,
      }),
      bridgeFee: formatFeeComponent({
        amount: bridgeFee.total,
        amountUsd: bridgeFeeUsd,
        token: bridgeFee.token,
        inputAmountUsd,
      }),
      app: formatFeeComponent({
        amount: appFeeAmount,
        amountUsd: appFeeUsd,
        token: appFeeToken,
        inputAmountUsd,
      }),
    };
  } catch (error) {
    logger.debug({
      at: "calculateSwapFees",
      message: "Error calculating swap fees",
      error,
    });
    return {};
  }
}

export function getNativeTokenInfo(chainId: number): Token {
  const chainInfo = getChainInfo(chainId);
  const token =
    TOKEN_SYMBOLS_MAP[chainInfo.nativeToken as keyof typeof TOKEN_SYMBOLS_MAP];
  return {
    chainId,
    address: ethers.constants.AddressZero,
    decimals: token.decimals,
    symbol: token.symbol,
  };
}

function safeUsdToTokenAmount(
  usdAmount: number,
  tokenPriceUsd: number,
  decimals: number
) {
  if (tokenPriceUsd === 0) return utils.parseUnits("0", decimals);
  const tokenAmount = usdAmount / tokenPriceUsd;
  if (tokenAmount <= 0 || isNaN(tokenAmount) || !isFinite(tokenAmount)) {
    return utils.parseUnits("0", decimals);
  }
  return utils.parseUnits(
    tokenAmount.toFixed(Math.min(decimals, 18)),
    decimals
  );
}

export async function buildBaseSwapResponseJson(params: {
  amountType: AmountType;
  amount: BigNumber;
  inputTokenAddress: string;
  originChainId: number;
  destinationChainId: number;
  inputAmount: BigNumber;
  allowance: BigNumber;
  balance: BigNumber;
  approvalTxns?: {
    chainId: number;
    to: string;
    data: string;
  }[];
  originSwapQuote?: SwapQuote;
  bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  destinationSwapQuote?: SwapQuote;
  refundOnOrigin: boolean;
  approvalSwapTx?:
    | {
        ecosystem: "evm";
        from: string;
        to: string;
        data: string;
        value?: BigNumber;
        gas?: BigNumber;
        maxFeePerGas?: BigNumber;
        maxPriorityFeePerGas?: BigNumber;
      }
    | {
        ecosystem: "svm";
        data: string;
        to: string;
      };
  permitSwapTx?: any; // TODO: Add type
  appFeePercent?: number;
  appFee?: AppFee;
  inputTokenPriceUsd: number;
  outputTokenPriceUsd: number;
  originNativePriceUsd: number;
  destinationNativePriceUsd: number;
  bridgeQuoteInputTokenPriceUsd: number;
  crossSwapType: CrossSwapType;
  indirectDestinationRoute?: IndirectDestinationRoute;
  logger: Logger;
}) {
  const refundToken = params.refundOnOrigin
    ? params.bridgeQuote.inputToken
    : params.bridgeQuote.outputToken;

  const {
    inputAmount,
    maxInputAmount,
    minOutputAmountSansAppFees,
    expectedOutputAmountSansAppFees,
  } = getAmounts(params);

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
        fees: params.bridgeQuote.fees,
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
      params.indirectDestinationRoute?.outputToken ??
      params.destinationSwapQuote?.tokenOut ??
      params.bridgeQuote.outputToken,
    refundToken:
      refundToken.symbol === "ETH"
        ? {
            ...refundToken,
            symbol: "WETH",
          }
        : refundToken,
    fees: await calculateSwapFees({
      inputAmount,
      originSwapQuote: params.originSwapQuote,
      bridgeQuote: params.bridgeQuote,
      destinationSwapQuote: params.destinationSwapQuote,
      appFeePercent: params.appFeePercent,
      appFee: params.appFee,
      originTxGas:
        params.approvalSwapTx?.ecosystem === "evm"
          ? params.approvalSwapTx?.gas
          : undefined,
      originTxGasPrice:
        params.approvalSwapTx?.ecosystem === "evm"
          ? params.approvalSwapTx?.maxFeePerGas
          : undefined,
      inputTokenPriceUsd: params.inputTokenPriceUsd,
      outputTokenPriceUsd: params.outputTokenPriceUsd,
      originNativePriceUsd: params.originNativePriceUsd,
      destinationNativePriceUsd: params.destinationNativePriceUsd,
      bridgeQuoteInputTokenPriceUsd: params.bridgeQuoteInputTokenPriceUsd,
      appFeeTokenPriceUsd: params.outputTokenPriceUsd,
      minOutputAmountSansAppFees,
      originChainId: params.originChainId,
      destinationChainId: params.destinationChainId,
      indirectDestinationRoute: params.indirectDestinationRoute,
      logger: params.logger,
    }),
    inputAmount,
    maxInputAmount,
    expectedOutputAmount: expectedOutputAmountSansAppFees,
    minOutputAmount: minOutputAmountSansAppFees,
    expectedFillTime: params.bridgeQuote.estimatedFillTimeSec,
    swapTx: getSwapTx(params),
    eip712: params.permitSwapTx?.eip712,
  });
}

function getAmounts(params: Parameters<typeof buildBaseSwapResponseJson>[0]) {
  let inputAmount = BigNumber.from(0);
  let maxInputAmount = BigNumber.from(0);
  let minOutputAmount = BigNumber.from(0);
  let expectedOutputAmount = BigNumber.from(0);

  const appFeeAmount = params.appFee?.feeAmount ?? 0;

  if (params.amountType === AMOUNT_TYPE.EXACT_INPUT) {
    inputAmount = params.amount;
    maxInputAmount = params.amount;

    // If the cross swap type B2BI, we need to convert the output amounts to correct chain decimals
    if (
      params.crossSwapType ===
        CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE_INDIRECT &&
      params.indirectDestinationRoute
    ) {
      const { intermediaryOutputToken, outputToken } =
        params.indirectDestinationRoute;
      minOutputAmount = ConvertDecimals(
        intermediaryOutputToken.decimals,
        outputToken.decimals
      )(params.bridgeQuote.outputAmount);
      expectedOutputAmount = ConvertDecimals(
        intermediaryOutputToken.decimals,
        outputToken.decimals
      )(params.bridgeQuote.outputAmount);
    } else {
      minOutputAmount =
        params.destinationSwapQuote?.minAmountOut ??
        params.bridgeQuote.outputAmount;
      expectedOutputAmount =
        params.destinationSwapQuote?.expectedAmountOut ??
        params.bridgeQuote.outputAmount;
    }
  } else if (params.amountType === AMOUNT_TYPE.EXACT_OUTPUT) {
    inputAmount =
      params.originSwapQuote?.expectedAmountIn ??
      params.bridgeQuote.inputAmount;
    maxInputAmount =
      params.originSwapQuote?.maximumAmountIn ?? params.bridgeQuote.inputAmount;
    minOutputAmount = params.amount;
    expectedOutputAmount = params.amount;
  } else if (params.amountType === AMOUNT_TYPE.MIN_OUTPUT) {
    inputAmount =
      params.originSwapQuote?.expectedAmountIn ??
      params.bridgeQuote.inputAmount;
    maxInputAmount =
      params.originSwapQuote?.maximumAmountIn ?? params.bridgeQuote.inputAmount;

    // If the cross swap type B2BI, we need to convert the output amounts to correct chain decimals
    if (
      params.crossSwapType ===
        CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE_INDIRECT &&
      params.indirectDestinationRoute
    ) {
      const { intermediaryOutputToken, outputToken } =
        params.indirectDestinationRoute;
      minOutputAmount = ConvertDecimals(
        intermediaryOutputToken.decimals,
        outputToken.decimals
      )(params.bridgeQuote.outputAmount);
      expectedOutputAmount = ConvertDecimals(
        intermediaryOutputToken.decimals,
        outputToken.decimals
      )(params.bridgeQuote.outputAmount);
    } else {
      minOutputAmount =
        params.destinationSwapQuote?.minAmountOut ??
        params.bridgeQuote.outputAmount;
      expectedOutputAmount =
        params.destinationSwapQuote?.expectedAmountOut ??
        params.bridgeQuote.outputAmount;
    }
  }

  const minOutputAmountSansAppFees =
    params.amountType === AMOUNT_TYPE.EXACT_OUTPUT
      ? minOutputAmount
      : minOutputAmount.sub(appFeeAmount);
  const expectedOutputAmountSansAppFees =
    params.amountType === AMOUNT_TYPE.EXACT_OUTPUT
      ? expectedOutputAmount
      : expectedOutputAmount.sub(appFeeAmount);

  return {
    inputAmount,
    maxInputAmount,
    minOutputAmount,
    expectedOutputAmount,
    minOutputAmountSansAppFees,
    expectedOutputAmountSansAppFees,
  };
}

export function getSwapTx(
  params: Parameters<typeof buildBaseSwapResponseJson>[0]
) {
  if (params.approvalSwapTx?.ecosystem === "evm") {
    return {
      simulationSuccess: !!params.approvalSwapTx.gas,
      chainId: params.originChainId,
      to: params.approvalSwapTx.to,
      data: params.approvalSwapTx.data,
      value: params.approvalSwapTx.value,
      gas: params.approvalSwapTx.gas,
      maxFeePerGas: params.approvalSwapTx.maxFeePerGas,
      maxPriorityFeePerGas: params.approvalSwapTx.maxPriorityFeePerGas,
    };
  }

  if (params.approvalSwapTx?.ecosystem === "svm") {
    return {
      simulationSuccess: false, // TODO: Figure out if we should simulate the tx on SVM
      chainId: params.originChainId,
      to: params.approvalSwapTx.to,
      data: params.approvalSwapTx.data,
    };
  }

  return params.permitSwapTx?.swapTx;
}
