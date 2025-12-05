import { useEstimatedRewards } from "views/Bridge/hooks/useEstimatedRewards";
import { getTokensForFeesCalc } from "views/Bridge/utils";

import { useTokenConversion } from "hooks/useTokenConversion";
import { useToken } from "hooks/useToken";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";
import { getSwapQuoteFees } from "views/SwapAndBridge/utils/fees";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";

export function useResolveFromBridgeAndSwapPagePayload(
  fromChainId: number,
  toChainId: number,
  inputTokenSymbol: string,
  outputTokenSymbol: string,
  payload?: FromBridgeAndSwapPagePayload
) {
  const { swapQuote } = payload || {};

  const isSwap =
    Boolean(swapQuote?.steps.originSwap) ||
    Boolean(swapQuote?.steps.destinationSwap);
  const isUniversalSwap = false;

  // Get fees from swapQuote.fees using helper
  const fees = getSwapQuoteFees(swapQuote);

  // Convert USD fee strings to BigNumbers (USD amounts are in 18 decimals)
  const bridgeFeeUsd = fees.bridgeFeesUsd
    ? BigNumber.from(parseUnits(fees.bridgeFeesUsd, 18))
    : undefined;
  const swapFeeUsd = fees.swapImpactUsd
    ? BigNumber.from(parseUnits(fees.swapImpactUsd, 18))
    : undefined;
  const totalFeeUsd = fees.totalFeeUsd
    ? BigNumber.from(parseUnits(fees.totalFeeUsd, 18))
    : undefined;

  const parsedAmount = swapQuote?.inputAmount;

  // Get swap token symbol if there's an origin swap
  const swapTokenSymbol = swapQuote?.steps.originSwap
    ? swapQuote.steps.originSwap.tokenOut.symbol
    : "";

  const swapToken = useToken(swapTokenSymbol);
  const outputToken = useToken(outputTokenSymbol, toChainId);
  const inputTokenFromHook = useToken(inputTokenSymbol, fromChainId);

  const {
    inputToken,
    bridgeToken,
    outputToken: outputTokenForCalc,
  } = inputTokenFromHook && outputToken
    ? getTokensForFeesCalc({
        inputToken: inputTokenFromHook,
        outputToken,
        isUniversalSwap: false,
        universalSwapQuote: undefined,
        fromChainId: fromChainId,
        toChainId: toChainId,
      })
    : {
        inputToken: inputTokenFromHook!,
        bridgeToken: inputTokenFromHook!,
        outputToken: outputToken,
      };

  const { convertTokenToBaseCurrency: convertInputTokenToUsd } =
    useTokenConversion(inputToken?.symbol || inputTokenSymbol, "usd");
  const { convertBaseCurrencyToToken: convertUsdToBridgeToken } =
    useTokenConversion(bridgeToken?.symbol || inputTokenSymbol, "usd");

  // Calculate parsedAmountUsd and outputAmountUsd
  const parsedAmountUsd = parsedAmount
    ? convertInputTokenToUsd(parsedAmount)
    : undefined;

  // Calculate output amount: input amount minus total fees
  const outputAmountUsd =
    parsedAmountUsd && totalFeeUsd
      ? parsedAmountUsd.sub(totalFeeUsd)
      : undefined;

  // Convert USD amounts back to token amounts for useEstimatedRewards
  const parsedAmountToken = convertUsdToBridgeToken(parsedAmountUsd);

  const bridgeFeeToken = convertUsdToBridgeToken(bridgeFeeUsd);
  const swapFeeToken = convertUsdToBridgeToken(swapFeeUsd);

  const estimatedRewards = useEstimatedRewards(
    bridgeToken!,
    toChainId,
    isSwap || isUniversalSwap,
    parsedAmountToken,
    bridgeFeeToken,
    swapFeeToken
  );

  // Net fee is the total fee (already calculated)
  const netFeeUsd = totalFeeUsd;

  return {
    swapQuote,
    estimatedRewards,
    bridgeFee: bridgeFeeToken,
    swapFee: swapFeeToken,
    bridgeFeeUsd,
    swapFeeUsd,
    isSwap,
    swapToken,
    inputToken,
    outputToken: outputTokenForCalc || outputToken,
    bridgeToken,
    amountAsBaseCurrency: parsedAmountUsd,
    outputAmountUsd,
    netFeeUsd,
    isUniversalSwap,
  };
}
