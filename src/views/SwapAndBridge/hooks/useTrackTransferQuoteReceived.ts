import { useCallback, useEffect, useRef } from "react";
import { ampli, TransferQuoteReceivedProperties } from "ampli";
import { useAmplitude } from "hooks/useAmplitude";
import { buildCoreTransferProperties } from "utils/amplitude/transferEventProperties";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { SwapApprovalQuote } from "../../../utils/serverless-api/prod/swap-approval";

type TrackTransferQuoteReceivedParams = {
  quote: SwapApprovalQuote;
  quoteRequest: QuoteRequest;
  quoteLatencyMilliseconds: number;
  sender: string;
  recipient: string;
};

type UseTrackTransferQuoteReceivedEffectParams = {
  quote: SwapApprovalQuote | undefined;
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
      const { quote, quoteRequest, sender, recipient } = params;

      const coreProperties = buildCoreTransferProperties({
        quote,
        sender,
        recipient,
        tradeType: quoteRequest.tradeType,
      });

      const properties: TransferQuoteReceivedProperties = {
        ...coreProperties,
        quoteTimestamp: String(Date.now()),
      };

      addToAmpliQueue(() => {
        ampli.transferQuoteReceived(properties);
      });
    },
    [addToAmpliQueue]
  );

  return { trackTransferQuoteReceived };
}
