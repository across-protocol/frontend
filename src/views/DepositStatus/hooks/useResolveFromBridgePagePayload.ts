import { BigNumber } from "ethers";

import { getToken } from "utils";
import { useEstimatedRewards } from "views/Bridge/hooks/useEstimatedRewards";
import { calcFeesForEstimatedTable } from "views/Bridge/utils";

import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { useTokenConversion } from "hooks/useTokenConversion";

export function useResolveFromBridgePagePayload(
  toChainId: number,
  inputTokenSymbol: string,
  payload?: FromBridgePagePayload
) {
  const {
    quote,
    quotedLimits,
    depositArgs,
    recipient,
    selectedRoute,
    swapQuote: _swapQuote,
  } = payload || {};

  const isSwap = selectedRoute?.type === "swap";
  const inputToken = getToken(inputTokenSymbol);
  const swapToken = isSwap
    ? getToken(selectedRoute.swapTokenSymbol)
    : undefined;
  const baseToken = swapToken || inputToken;

  const { relayerGasFee, relayerCapitalFee, lpFee: _lpFee } = quote || {};
  const { bridgeFee, swapFee, gasFee, lpFee, swapQuote, capitalFee } =
    calcFeesForEstimatedTable({
      gasFee: relayerGasFee ? BigNumber.from(relayerGasFee.total) : undefined,
      capitalFee: relayerCapitalFee
        ? BigNumber.from(relayerCapitalFee.total)
        : undefined,
      lpFee: _lpFee ? BigNumber.from(_lpFee.total) : undefined,
      isSwap,
      parsedAmount: depositArgs
        ? BigNumber.from(depositArgs.initialAmount)
        : undefined,
      swapQuote: _swapQuote
        ? {
            ..._swapQuote,
            minExpectedInputTokenAmount: BigNumber.from(
              _swapQuote.minExpectedInputTokenAmount
            ),
          }
        : undefined,
    }) || {};

  const estimatedRewards = useEstimatedRewards(
    baseToken,
    toChainId,
    isSwap,
    depositArgs ? BigNumber.from(depositArgs?.initialAmount) : undefined,
    gasFee,
    bridgeFee,
    swapFee
  );

  const { convertTokenToBaseCurrency: inputTokenToUsd } = useTokenConversion(
    inputTokenSymbol,
    "usd"
  );

  const amountAsBaseCurrency = inputTokenToUsd(
    payload?.depositArgs?.initialAmount
  );

  return {
    quote,
    quotedLimits,
    depositArgs,
    recipient,
    selectedRoute,
    swapQuote,
    estimatedRewards,
    bridgeFee,
    swapFee,
    gasFee,
    lpFee,
    capitalFee,
    isSwap,
    swapToken,
    baseToken,
    amountAsBaseCurrency,
  };
}
