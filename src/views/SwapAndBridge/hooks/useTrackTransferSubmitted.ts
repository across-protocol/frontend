import { useCallback, useEffect, useRef } from "react";
import { ampli, TransferSubmittedProperties } from "ampli";
import { useAmplitude } from "hooks/useAmplitude";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";
import { buildCoreTransferProperties } from "utils/amplitude/transferEventProperties";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import useReferrer from "hooks/useReferrer";

type UseTrackTransferSubmittedParams = {
  quote: SwapApprovalQuote | undefined;
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

    const coreProperties = buildCoreTransferProperties({
      quote,
      sender,
      recipient,
      tradeType: quoteRequest.tradeType,
    });

    const properties: TransferSubmittedProperties = {
      ...coreProperties,
      quoteTimestamp: String(firstQuoteTimestampRef.current),
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
