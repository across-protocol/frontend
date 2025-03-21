import { assert, Infer, type, string, optional, enums } from "superstruct";
import { BigNumber, constants, utils } from "ethers";

import { TypedVercelRequest } from "../_types";
import {
  positiveFloatStr,
  positiveIntStr,
  validAddress,
  boolStr,
  getCachedTokenInfo,
  getWrappedNativeTokenAddress,
  getCachedTokenPrice,
} from "../_utils";
import { InvalidParamError } from "../_errors";
import { isValidIntegratorId } from "../_integrator-id";
import {
  CrossSwapFees,
  CrossSwapQuotes,
  SwapQuote,
  Token,
  AmountType,
} from "../_dexes/types";
import { AMOUNT_TYPE } from "../_dexes/utils";
import { encodeApproveCalldata } from "../_multicall-handler";

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
    tradeType = AMOUNT_TYPE.MIN_OUTPUT,
    recipient,
    depositor,
    integratorId,
    refundAddress,
    refundOnOrigin: _refundOnOrigin = "true",
    slippageTolerance = "1", // Default to 1% slippage
    skipOriginTxEstimation: _skipOriginTxEstimation = "false",
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

  const refundToken = refundOnOrigin ? inputToken : outputToken;

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
    refundToken,
  };
}

export function getApprovalTxns(params: {
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
  if (params.token.symbol === "USDT") {
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
  refundToken: Token;
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
  return stringifyBigNumProps({
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
          }
        : undefined,
      bridge: {
        inputAmount: params.bridgeQuote.inputAmount,
        outputAmount: params.bridgeQuote.outputAmount,
        tokenIn: params.bridgeQuote.inputToken,
        tokenOut: params.bridgeQuote.outputToken,
      },
      destinationSwap: params.destinationSwapQuote
        ? {
            tokenIn: params.destinationSwapQuote.tokenIn,
            tokenOut: params.destinationSwapQuote.tokenOut,
            inputAmount: params.destinationSwapQuote.expectedAmountIn,
            maxInputAmount: params.destinationSwapQuote.maximumAmountIn,
            outputAmount: params.destinationSwapQuote.expectedAmountOut,
            minOutputAmount: params.destinationSwapQuote.minAmountOut,
          }
        : undefined,
    },
    refundToken:
      params.refundToken.symbol === "ETH"
        ? {
            ...params.refundToken,
            symbol: "WETH",
          }
        : params.refundToken,
    inputAmount:
      params.originSwapQuote?.expectedAmountIn ??
      params.bridgeQuote.inputAmount,
    expectedOutputAmount:
      params.destinationSwapQuote?.expectedAmountOut ??
      params.bridgeQuote.outputAmount,
    minOutputAmount:
      params.destinationSwapQuote?.minAmountOut ??
      params.bridgeQuote.outputAmount,
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
