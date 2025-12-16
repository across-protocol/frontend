import { useCallback, useEffect, useRef } from "react";
import { ampli, TransferQuoteReceivedProperties } from "ampli";
import { useAmplitude } from "hooks";
import { SwapApprovalApiCallReturnType } from "utils/serverless-api/prod/swap-approval";
import { getChainInfo } from "utils";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";

type TrackTransferQuoteReceivedParams = {
  quote: SwapApprovalApiCallReturnType;
  quoteRequest: QuoteRequest;
  quoteLatencyMilliseconds: number;
  sender: string;
  recipient: string;
};

type UseTrackTransferQuoteReceivedEffectParams = {
  quote: SwapApprovalApiCallReturnType | undefined;
  quoteRequest: QuoteRequest;
  dataUpdatedAt: number;
  depositorOrPlaceholder: string;
  recipientOrPlaceholder: string;
  customDestinationAddress: string | undefined;
  quoteStartTimeRef: React.MutableRefObject<number>;
};

export function useTrackTransferQuoteReceivedEffect({
  quote,
  quoteRequest,
  dataUpdatedAt,
  depositorOrPlaceholder,
  recipientOrPlaceholder,
  customDestinationAddress,
  quoteStartTimeRef,
}: UseTrackTransferQuoteReceivedEffectParams) {
  const lastTrackedQuoteRef = useRef<string | null>(null);
  const { trackTransferQuoteReceived } = useTrackTransferQuoteReceived();

  useEffect(() => {
    if (!quote) return;

    const quoteIdentifier = `${quote.inputToken.address}-${quote.outputToken.address}-${quote.inputAmount.toString()}-${dataUpdatedAt}`;
    if (lastTrackedQuoteRef.current === quoteIdentifier) return;
    lastTrackedQuoteRef.current = quoteIdentifier;

    const quoteLatencyMilliseconds =
      quoteStartTimeRef.current > 0
        ? Date.now() - quoteStartTimeRef.current
        : 0;

    const sender = depositorOrPlaceholder;
    const recipient = customDestinationAddress ?? recipientOrPlaceholder;

    trackTransferQuoteReceived({
      quote,
      quoteRequest,
      quoteLatencyMilliseconds,
      sender,
      recipient,
    });
  }, [
    quote,
    dataUpdatedAt,
    quoteRequest,
    depositorOrPlaceholder,
    recipientOrPlaceholder,
    customDestinationAddress,
    trackTransferQuoteReceived,
    quoteStartTimeRef,
  ]);
}

function useTrackTransferQuoteReceived() {
  const { addToAmpliQueue } = useAmplitude();

  const trackTransferQuoteReceived = useCallback(
    (params: TrackTransferQuoteReceivedParams) => {
      const {
        quote,
        quoteRequest,
        quoteLatencyMilliseconds,
        sender,
        recipient,
      } = params;

      const fromChainInfo = getChainInfo(quote.inputToken.chainId);
      const toChainInfo = getChainInfo(quote.outputToken.chainId);
      const bridgeStep = quote.steps.bridge;
      const bridgeFeeDetails = bridgeStep.fees.details;

      const quoteTimestamp = Date.now();

      const properties: TransferQuoteReceivedProperties = {
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
        quoteLatencyMilliseconds: String(quoteLatencyMilliseconds),
        quoteTimestamp: String(quoteTimestamp),
        transferQuoteBlockNumber: "0",
        swapType:
          quote.crossSwapType as TransferQuoteReceivedProperties["swapType"],
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
      };

      addToAmpliQueue(() => {
        ampli.transferQuoteReceived(properties);
      });
    },
    [addToAmpliQueue]
  );

  return { trackTransferQuoteReceived };
}
