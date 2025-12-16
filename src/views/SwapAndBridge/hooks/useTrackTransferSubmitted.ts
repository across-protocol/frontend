import { useCallback, useEffect, useRef } from "react";
import { ampli, TransferSubmittedProperties } from "ampli";
import { useAmplitude } from "hooks";
import { SwapApprovalApiCallReturnType } from "utils/serverless-api/prod/swap-approval";
import { getChainInfo } from "utils";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import useReferrer from "hooks/useReferrer";

type UseTrackTransferSubmittedParams = {
  quote: SwapApprovalApiCallReturnType | undefined;
  quoteRequest: QuoteRequest;
  depositorOrPlaceholder: string;
  recipientOrPlaceholder: string;
  customDestinationAddress: string | undefined;
};

export function useTrackTransferSubmitted({
  quote,
  quoteRequest,
  depositorOrPlaceholder,
  recipientOrPlaceholder,
  customDestinationAddress,
}: UseTrackTransferSubmittedParams) {
  const { addToAmpliQueue } = useAmplitude();
  const { referrer } = useReferrer();
  const firstQuoteTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (quote && firstQuoteTimestampRef.current === 0) {
      firstQuoteTimestampRef.current = Date.now();
    }
  }, [quote]);

  const trackTransferSubmitted = useCallback(() => {
    if (!quote) return;

    const transferTimestamp = Date.now();
    const timeFromFirstQuoteToTransferSubmittedInMilliseconds =
      firstQuoteTimestampRef.current > 0
        ? transferTimestamp - firstQuoteTimestampRef.current
        : 0;

    const sender = depositorOrPlaceholder;
    const recipient = customDestinationAddress ?? recipientOrPlaceholder;

    const fromChainInfo = getChainInfo(quote.inputToken.chainId);
    const toChainInfo = getChainInfo(quote.outputToken.chainId);
    const bridgeStep = quote.steps.bridge;
    const bridgeFeeDetails = bridgeStep.fees.details;

    const properties: TransferSubmittedProperties = {
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
      isSenderEqRecipient: sender.toLowerCase() === recipient.toLowerCase(),
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
      quoteLatencyMilliseconds: "0",
      quoteTimestamp: String(firstQuoteTimestampRef.current),
      transferQuoteBlockNumber: "0",
      swapType: quote.crossSwapType as TransferSubmittedProperties["swapType"],
      inputType: quoteRequest.tradeType,
      inputUnits: "token",
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
      totalFeePct: quote.fees?.total.pct?.toString() ?? "0",
      totalFeeUsd: quote.fees?.total.amountUsd ?? "0",
      transferTimestamp: String(transferTimestamp),
      timeFromFirstQuoteToTransferSubmittedInMilliseconds: String(
        timeFromFirstQuoteToTransferSubmittedInMilliseconds
      ),
      referralProgramAddress: referrer ?? undefined,
    };

    addToAmpliQueue(() => {
      ampli.transferSubmitted(properties);
    });
  }, [
    quote,
    quoteRequest,
    depositorOrPlaceholder,
    recipientOrPlaceholder,
    customDestinationAddress,
    referrer,
    addToAmpliQueue,
  ]);

  return { trackTransferSubmitted };
}
