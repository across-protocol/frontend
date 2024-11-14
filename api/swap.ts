import { VercelResponse } from "@vercel/node";
import { assert, Infer, type, string, optional } from "superstruct";
import { BigNumber } from "ethers";

import { TypedVercelRequest } from "./_types";
import {
  getLogger,
  handleErrorCondition,
  positiveFloatStr,
  positiveIntStr,
  validAddress,
  boolStr,
  getTokenByAddress,
} from "./_utils";
import {
  AMOUNT_TYPE,
  buildCrossSwapTx,
  getCrossSwapQuotes,
} from "./_dexes/cross-swap";
import { Token } from "./_dexes/types";
import { InvalidParamError, MissingParamError } from "./_errors";
import { isValidIntegratorId } from "./_integrator-id";

const SwapQueryParamsSchema = type({
  minOutputAmount: optional(positiveIntStr()),
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

    if (!_minOutputAmount && !_exactInputAmount) {
      throw new MissingParamError({
        param: "minOutputAmount, exactInputAmount",
        message: "One of 'minOutputAmount' or 'exactInputAmount' is required",
      });
    }

    if (_minOutputAmount && _exactInputAmount) {
      throw new InvalidParamError({
        param: "minOutputAmount, exactInputAmount",
        message:
          "Only one of 'minOutputAmount' or 'exactInputAmount' is allowed",
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
      : AMOUNT_TYPE.EXACT_INPUT;
    const amount = BigNumber.from(
      amountType === AMOUNT_TYPE.EXACT_INPUT
        ? _exactInputAmount
        : _minOutputAmount
    );

    // 1. Get auxiliary data
    // - Token details
    // - Token prices
    const knownInputToken = getTokenByAddress(
      _inputTokenAddress,
      originChainId
    );
    const inputToken: Token = knownInputToken
      ? {
          address: knownInputToken.addresses[originChainId]!,
          decimals: knownInputToken.decimals,
          symbol: knownInputToken.symbol,
          chainId: originChainId,
        }
      : // @FIXME: fetch dynamic token details. using hardcoded values for now
        {
          address: _inputTokenAddress,
          decimals: 18,
          symbol: "UNKNOWN",
          chainId: originChainId,
        };
    const knownOutputToken = getTokenByAddress(
      _outputTokenAddress,
      destinationChainId
    );
    const outputToken: Token = knownOutputToken
      ? {
          address: knownOutputToken.addresses[destinationChainId]!,
          decimals: knownOutputToken.decimals,
          symbol: knownOutputToken.symbol,
          chainId: destinationChainId,
        }
      : // @FIXME: fetch dynamic token details. using hardcoded values for now
        {
          address: _outputTokenAddress,
          decimals: 18,
          symbol: "UNKNOWN",
          chainId: destinationChainId,
        };

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
