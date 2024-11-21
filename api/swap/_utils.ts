import { assert, Infer, type, string, optional } from "superstruct";
import { BigNumber, constants, utils } from "ethers";

import { TypedVercelRequest } from "../_types";
import {
  positiveFloatStr,
  positiveIntStr,
  validAddress,
  boolStr,
  getCachedTokenInfo,
  getWrappedNativeTokenAddress,
} from "../_utils";
import { AMOUNT_TYPE, getCrossSwapQuotes } from "../_dexes/cross-swap";
import { InvalidParamError, MissingParamError } from "../_errors";
import { isValidIntegratorId } from "../_integrator-id";

export const BaseSwapQueryParamsSchema = type({
  minOutputAmount: optional(positiveIntStr()),
  exactOutputAmount: optional(positiveIntStr()),
  exactInputAmount: optional(positiveIntStr()),
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

export async function handleBaseSwapQueryParams({
  query,
}: TypedVercelRequest<BaseSwapQueryParams>) {
  assert(query, BaseSwapQueryParamsSchema);

  const {
    inputToken: _inputTokenAddress,
    outputToken: _outputTokenAddress,
    exactInputAmount: _exactInputAmount,
    minOutputAmount: _minOutputAmount,
    exactOutputAmount: _exactOutputAmount,
    originChainId: _originChainId,
    destinationChainId: _destinationChainId,
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

  if (!_minOutputAmount && !_exactInputAmount && !_exactOutputAmount) {
    throw new MissingParamError({
      param: "minOutputAmount, exactInputAmount, exactOutputAmount",
      message:
        "One of 'minOutputAmount', 'exactInputAmount' or 'exactOutputAmount' is required",
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

  const amountType = _minOutputAmount
    ? AMOUNT_TYPE.MIN_OUTPUT
    : _exactInputAmount
      ? AMOUNT_TYPE.EXACT_INPUT
      : AMOUNT_TYPE.EXACT_OUTPUT;
  const amount = BigNumber.from(
    _minOutputAmount || _exactInputAmount || _exactOutputAmount
  );

  // 1. Get token details
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

  // 2. Get swap quotes and calldata based on the swap type
  const crossSwapQuotes = await getCrossSwapQuotes({
    amount,
    inputToken,
    outputToken,
    depositor,
    recipient: recipient || depositor,
    slippageTolerance: Number(slippageTolerance),
    type: amountType,
    refundOnOrigin,
    refundAddress,
    isInputNative,
    isOutputNative,
  });

  return { crossSwapQuotes, integratorId, skipOriginTxEstimation };
}
