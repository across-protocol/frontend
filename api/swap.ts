import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string, optional } from "superstruct";
import { BigNumber, constants, utils } from "ethers";

import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  handleErrorCondition,
  positiveFloatStr,
  positiveIntStr,
  validAddress,
  boolStr,
  getCachedTokenInfo,
  getWrappedNativeTokenAddress,
} from "./_utils";
import {
  AMOUNT_TYPE,
  buildCrossSwapTx,
  getCrossSwapQuotes,
} from "./_dexes/cross-swap";
import { InvalidParamError, MissingParamError } from "./_errors";
import { isValidIntegratorId } from "./_integrator-id";

const SwapQueryParamsSchema = type({
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
});

type SwapQueryParams = Infer<typeof SwapQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<SwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap",
    message: "Query data",
    query,
  });
  try {
    assert(query, SwapQueryParamsSchema);

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
    } = query;

    const originChainId = Number(_originChainId);
    const destinationChainId = Number(_destinationChainId);
    const refundOnOrigin = _refundOnOrigin === "true";
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

    // 3. Build cross swap tx
    const crossSwapTx = await buildCrossSwapTx(crossSwapQuotes, integratorId);

    const responseJson = {
      tx: {
        to: crossSwapTx.to,
        data: crossSwapTx.data,
        value: crossSwapTx.value?.toString(),
        gas: crossSwapTx.gas?.toString(),
        gasPrice: crossSwapTx.gasPrice?.toString(),
      },
    };

    logger.debug({
      at: "Swap",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap", response, logger, error);
  }
};

export default handler;
