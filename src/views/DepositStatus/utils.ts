import { BigNumber, BigNumberish } from "ethers";
import { UniversalSwapQuote } from "hooks/useUniversalSwapQuote";
import { TokenInfo, getConfig } from "utils";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";

export enum AmountInputError {
  INVALID = "invalid",
  PAUSED_DEPOSITS = "pausedDeposits",
  INSUFFICIENT_LIQUIDITY = "insufficientLiquidity",
  INSUFFICIENT_BALANCE = "insufficientBalance",
  AMOUNT_TOO_LOW = "amountTooLow",
  PRICE_IMPACT_TOO_HIGH = "priceImpactTooHigh",
  SWAP_QUOTE_UNAVAILABLE = "swapQuoteUnavailable",
  NO_INPUT_TOKEN_SELECTED = "noInputTokenSelected",
  NO_OUTPUT_TOKEN_SELECTED = "noOutputTokenSelected",
  NO_AMOUNT_ENTERED = "noAmountEntered",
}

export function calcFeesForEstimatedTable(params: {
  capitalFee?: BigNumberish;
  lpFee?: BigNumberish;
  gasFee?: BigNumberish;
  isSwap: boolean;
  isUniversalSwap: boolean;
  parsedAmount?: BigNumberish;
  swapQuote?: SwapQuoteApiResponse;
  universalSwapQuote?: UniversalSwapQuote;
  convertInputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertBridgeTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertOutputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
}) {
  if (
    !params.capitalFee ||
    !params.lpFee ||
    !params.gasFee ||
    !params.parsedAmount ||
    (params.isSwap && !params.swapQuote) ||
    (params.isUniversalSwap && !params.universalSwapQuote)
  ) {
    return;
  }

  const parsedAmount = BigNumber.from(params.parsedAmount || 0);
  const capitalFee = BigNumber.from(
    params.universalSwapQuote
      ? params.universalSwapQuote.steps.bridge.fees.details?.relayerCapital
          .amount
      : params.capitalFee || 0
  );
  const lpFee = BigNumber.from(
    params.universalSwapQuote
      ? params.universalSwapQuote.steps.bridge.fees.details?.lp.amount
      : params.lpFee || 0
  );
  const gasFee = BigNumber.from(
    params.universalSwapQuote
      ? params.universalSwapQuote.steps.bridge.fees.details?.destinationGas
          .amount
      : params.gasFee || 0
  );
  // We display the sum of capital + lp fee as "bridge fee" in `EstimatedTable`.
  const bridgeFee = capitalFee.add(lpFee);

  const parsedAmountUsd =
    params.convertInputTokenToUsd(parsedAmount) || BigNumber.from(0);
  const gasFeeUsd = params.convertBridgeTokenToUsd(gasFee) || BigNumber.from(0);
  const bridgeFeeUsd =
    params.convertBridgeTokenToUsd(bridgeFee) || BigNumber.from(0);
  const capitalFeeUsd =
    params.convertBridgeTokenToUsd(capitalFee) || BigNumber.from(0);
  const lpFeeUsd = params.convertBridgeTokenToUsd(lpFee) || BigNumber.from(0);
  const totalRelayFeeUsd = gasFeeUsd.add(bridgeFeeUsd);
  const swapFeeUsd =
    params.isSwap && params.swapQuote
      ? calcSwapFeeUsd(params)
      : params.isUniversalSwap && params.universalSwapQuote
        ? calcUniversalSwapFeeUsd(params)
        : BigNumber.from(0);
  const totalFeeUsd = totalRelayFeeUsd.add(swapFeeUsd);
  const outputAmountUsd = parsedAmountUsd.sub(totalFeeUsd);

  return {
    parsedAmountUsd,
    gasFeeUsd,
    bridgeFeeUsd,
    capitalFeeUsd,
    lpFeeUsd,
    totalRelayFeeUsd,
    swapFeeUsd,
    totalFeeUsd,
    outputAmountUsd,
  };
}

function calcSwapFeeUsd(params: {
  parsedAmount?: BigNumberish;
  swapQuote?: SwapQuoteApiResponse;
  convertInputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertBridgeTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
}) {
  if (!params.swapQuote || !params.parsedAmount) {
    return BigNumber.from(0);
  }
  const parsedInputAmountUsd =
    params.convertInputTokenToUsd(BigNumber.from(params.parsedAmount)) ||
    BigNumber.from(0);
  const swapFeeUsd = parsedInputAmountUsd.sub(
    params.convertBridgeTokenToUsd(
      BigNumber.from(params.swapQuote.minExpectedInputTokenAmount)
    ) || BigNumber.from(0)
  );
  return swapFeeUsd;
}

function calcUniversalSwapFeeUsd(params: {
  parsedAmount?: BigNumberish;
  universalSwapQuote?: UniversalSwapQuote;
  convertInputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertBridgeTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
  convertOutputTokenToUsd: (amount: BigNumber) => BigNumber | undefined;
}) {
  if (!params.universalSwapQuote || !params.parsedAmount) {
    return BigNumber.from(0);
  }
  const parsedAmount = BigNumber.from(params.parsedAmount || 0);
  const { steps } = params.universalSwapQuote;
  const parsedInputAmountUsd =
    params.convertInputTokenToUsd(parsedAmount) || BigNumber.from(0);
  const originSwapFeeUsd = parsedInputAmountUsd.sub(
    params.convertBridgeTokenToUsd(steps.bridge.inputAmount) ||
      BigNumber.from(0)
  );
  const destinationSwapFeeUsd = (
    params.convertBridgeTokenToUsd(steps.bridge.outputAmount) ||
    BigNumber.from(0)
  ).sub(
    params.convertOutputTokenToUsd(
      steps.destinationSwap?.outputAmount || steps.bridge.outputAmount
    ) || BigNumber.from(0)
  );
  return originSwapFeeUsd.add(destinationSwapFeeUsd);
}

export function getTokensForFeesCalc(params: {
  swapToken?: TokenInfo;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  isUniversalSwap: boolean;
  universalSwapQuote?: UniversalSwapQuote;
  fromChainId: number;
  toChainId: number;
}) {
  const config = getConfig();
  const inputToken = params.swapToken || params.inputToken;
  const bridgeToken =
    params.isUniversalSwap && params.universalSwapQuote
      ? config.getTokenInfoBySymbol(
          params.fromChainId,
          params.universalSwapQuote.steps.bridge.tokenIn.symbol
        )
      : inputToken;
  const outputToken =
    params.isUniversalSwap && params.universalSwapQuote
      ? config.getTokenInfoBySymbol(
          params.toChainId,
          params.universalSwapQuote.steps.destinationSwap?.tokenOut.symbol ||
            params.universalSwapQuote.steps.bridge.tokenOut.symbol
        )
      : params.outputToken;
  return {
    inputToken,
    outputToken,
    bridgeToken,
  };
}
