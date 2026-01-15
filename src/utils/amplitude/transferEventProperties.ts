import { getChainInfo } from "utils";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";

type CoreTransferPropertiesParams = {
  quote: SwapApprovalQuote;
  sender: string;
  recipient: string;
  tradeType: "exactInput" | "exactOutput" | "minOutput";
};

export function buildCoreTransferProperties({
  quote,
  sender,
  recipient,
  tradeType,
}: CoreTransferPropertiesParams) {
  const fromChainInfo = getChainInfo(quote.inputToken.chainId);
  const toChainInfo = getChainInfo(quote.outputToken.chainId);
  const bridgeStep = quote.steps.bridge;
  const bridgeFeeDetails = bridgeStep.fees.details;

  return {
    fromChainId: String(quote.inputToken.chainId),
    fromChainName: fromChainInfo.name,
    toChainId: String(quote.outputToken.chainId),
    toChainName: toChainInfo.name,
    fromTokenAddress: quote.inputToken.address,
    fromTokenSymbol: quote.inputToken.symbol,
    toTokenAddress: quote.outputToken.address,
    toTokenSymbol: quote.outputToken.symbol,
    bridgeTokenAddress: bridgeStep.tokenIn.address,
    bridgeTokenSymbol: bridgeStep.tokenIn.symbol,
    fromAmount: quote.inputAmount.toString(),
    fromAmountUsd: quote.fees?.total.details.swapImpact.amountUsd ?? "0",
    toAmount: quote.expectedOutputAmount.toString(),
    toAmountUsd: quote.fees?.total.amountUsd ?? "0",
    sender,
    recipient,
    isSenderEqRecipient: sender?.toLowerCase() === recipient?.toLowerCase(),
    routeChainIdFromTo: `${quote.inputToken.chainId}-${quote.outputToken.chainId}`,
    routeChainNameFromTo: `${fromChainInfo.name}-${toChainInfo.name}`,
    expectedFillTimeInSec: String(quote.expectedFillTime),
    expectedFillTimeInSecLowerBound: String(quote.expectedFillTime),
    expectedFillTimeInSecUpperBound: String(quote.expectedFillTime),
    lpFeePct: bridgeFeeDetails?.lp.pct.toString() ?? "0",
    lpFeeTotalUsd: bridgeFeeDetails?.lp.amount.toString() ?? "0",
    capitalFeePct: bridgeFeeDetails?.relayerCapital.pct.toString() ?? "0",
    capitalFeeTotalUsd:
      bridgeFeeDetails?.relayerCapital.amount.toString() ?? "0",
    relayGasFeePct: bridgeFeeDetails?.destinationGas.pct.toString() ?? "0",
    relayGasFeeTotalUsd:
      bridgeFeeDetails?.destinationGas.amount.toString() ?? "0",
    relayFeePct: bridgeStep.fees.pct.toString(),
    relayFeeTotalUsd: bridgeStep.fees.amount.toString(),
    swapType: quote.crossSwapType,
    inputType: tradeType,
    inputUnits: "token" as const,
    destinationSwapFeePct:
      quote.fees?.total.details.swapImpact.pct?.toString() ?? "0",
    destinationSwapFeeUsd:
      quote.fees?.total.details.swapImpact.amountUsd ?? "0",
    originSwapFeePct:
      quote.fees?.total.details.swapImpact.pct?.toString() ?? "0",
    originSwapFeeUsd: quote.fees?.total.details.swapImpact.amountUsd ?? "0",
    originGasFeePct: quote.fees?.originGas.pct?.toString() ?? "0",
    originGasFeeUsd: quote.fees?.originGas.amountUsd ?? "0",
    appFeePct: quote.fees?.total.details.app.pct?.toString() ?? "0",
    appFeeUsd: quote.fees?.total.details.app.amountUsd ?? "0",
  };
}
