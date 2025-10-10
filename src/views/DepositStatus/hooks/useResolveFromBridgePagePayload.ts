import { getToken } from "utils";
import { useEstimatedRewards } from "views/Bridge/hooks/useEstimatedRewards";
import {
  calcFeesForEstimatedTable,
  getTokensForFeesCalc,
} from "views/Bridge/utils";

import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { useTokenConversion } from "hooks/useTokenConversion";
import { bigNumberifyObject } from "utils/bignumber";
import { UniversalSwapQuote } from "hooks/useUniversalSwapQuote";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";

export function useResolveFromBridgePagePayload(
  fromChainId: number,
  toChainId: number,
  inputTokenSymbol: string,
  outputTokenSymbol: string,
  payload?: FromBridgePagePayload
) {
  const {
    quote,
    quotedLimits,
    depositArgs,
    recipient,
    selectedRoute,
    swapQuote,
    universalSwapQuote,
  } = payload || {};
  const { relayerGasFee, relayerCapitalFee, lpFee: _lpFee } = quote || {};

  const isSwap = selectedRoute?.type === "swap";
  const isUniversalSwap = selectedRoute?.type === "universal-swap";
  const swapToken = isSwap
    ? getToken(selectedRoute.swapTokenSymbol)
    : undefined;
  const { inputToken, bridgeTokenIn, bridgeTokenOut, outputToken } =
    getTokensForFeesCalc({
      inputToken: getToken(inputTokenSymbol),
      outputToken: getToken(outputTokenSymbol),
      isUniversalSwap: !!universalSwapQuote,
      universalSwapQuote,
      fromChainId: fromChainId,
      toChainId: toChainId,
    });

  const {
    convertTokenToBaseCurrency: convertInputTokenToUsd,
    convertBaseCurrencyToToken: convertUsdToInputToken,
  } = useTokenConversion(inputToken.symbol, "usd");
  const {
    convertTokenToBaseCurrency: convertBridgeTokenInToUsd,
    convertBaseCurrencyToToken: convertUsdToBridgeTokenIn,
  } = useTokenConversion(bridgeTokenIn.symbol, "usd");
  const { convertTokenToBaseCurrency: convertBridgeTokenOutToUsd } =
    useTokenConversion(bridgeTokenOut.symbol, "usd");
  const { convertTokenToBaseCurrency: convertOutputTokenToUsd } =
    useTokenConversion(outputToken.symbol, "usd");

  const {
    bridgeFeeUsd,
    swapFeeUsd,
    gasFeeUsd,
    lpFeeUsd,
    parsedAmountUsd,
    capitalFeeUsd,
  } =
    calcFeesForEstimatedTable({
      gasFee: relayerGasFee?.total,
      capitalFee: relayerCapitalFee?.total,
      lpFee: _lpFee?.total,
      isSwap,
      parsedAmount: depositArgs?.initialAmount,
      swapQuote,
      universalSwapQuote,
      isUniversalSwap,
      convertInputTokenToUsd,
      convertBridgeTokenInToUsd,
      convertBridgeTokenOutToUsd,
      convertOutputTokenToUsd,
    }) || {};
  const parsedAmount = convertUsdToInputToken(parsedAmountUsd);
  const gasFee = convertUsdToBridgeTokenIn(gasFeeUsd);
  const bridgeFee = convertUsdToBridgeTokenIn(bridgeFeeUsd);
  const swapFee = convertUsdToBridgeTokenIn(swapFeeUsd);
  const lpFee = convertUsdToBridgeTokenIn(lpFeeUsd);
  const capitalFee = convertUsdToBridgeTokenIn(capitalFeeUsd);

  const estimatedRewards = useEstimatedRewards(
    bridgeTokenIn,
    toChainId,
    isSwap || isUniversalSwap,
    parsedAmount,
    gasFee,
    bridgeFee,
    swapFee
  );

  return {
    quote,
    quotedLimits,
    depositArgs,
    recipient,
    selectedRoute,
    swapQuote: swapQuote
      ? bigNumberifyObject<SwapQuoteApiResponse>(swapQuote)
      : undefined,
    estimatedRewards,
    bridgeFee,
    swapFee,
    gasFee,
    lpFee,
    capitalFee,
    isSwap,
    swapToken,
    inputToken,
    outputToken,
    bridgeTokenIn,
    bridgeTokenOut,
    amountAsBaseCurrency: parsedAmountUsd,
    isUniversalSwap,
    universalSwapQuote: universalSwapQuote
      ? bigNumberifyObject<UniversalSwapQuote>(universalSwapQuote)
      : undefined,
  };
}
