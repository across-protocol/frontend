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
  getLogger,
} from "../_utils";
import {
  AMOUNT_TYPE,
  getCrossSwapQuotes,
  AmountType,
} from "../_dexes/cross-swap";
import { InvalidParamError } from "../_errors";
import { isValidIntegratorId } from "../_integrator-id";
import { CrossSwapFees, CrossSwapQuotes, SwapQuote } from "../_dexes/types";
import { Coingecko } from "@across-protocol/sdk/dist/types/coingecko";
import { formatUnits } from "ethers/lib/utils";

export const BaseSwapQueryParamsSchema = type({
  amount: positiveIntStr(),
  tradeType: optional(enums(["minOutput", "exactOutput"])),
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

  // 3. Calculate fees based for full route
  const fees = await calculateCrossSwapFees(crossSwapQuotes);

  return {
    crossSwapQuotes: {
      ...crossSwapQuotes,
      fees,
    },
    integratorId,
    skipOriginTxEstimation,
  };
}

const coingeckoClient = Coingecko.get(
  getLogger(),
  process.env.REACT_APP_COINGECKO_PRO_API_KEY
);

async function calculateSwapFee(
  swapQuote: SwapQuote,
  baseCurrency: string
): Promise<Record<string, number>> {
  const { tokenIn, tokenOut, expectedAmountOut, expectedAmountIn } = swapQuote;
  const [[, inputTokenPriceBase], [, outputTokenPriceBase]] = await Promise.all(
    [
      coingeckoClient.getCurrentPriceByContract(
        tokenIn.address,
        baseCurrency,
        tokenIn.chainId
      ),
      coingeckoClient.getCurrentPriceByContract(
        tokenOut.address,
        baseCurrency,
        tokenOut.chainId
      ),
    ]
  );

  const normalizedIn =
    parseFloat(formatUnits(expectedAmountIn, tokenIn.decimals)) *
    inputTokenPriceBase;
  const normalizedOut =
    parseFloat(formatUnits(expectedAmountOut, tokenOut.decimals)) *
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
  const [, inputTokenPriceBase] =
    await coingeckoClient.getCurrentPriceByContract(
      inputToken.address,
      baseCurrency,
      inputToken.chainId
    );
  const normalizedFee =
    parseFloat(
      formatUnits(suggestedFees.totalRelayFee.total, inputToken.decimals)
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
