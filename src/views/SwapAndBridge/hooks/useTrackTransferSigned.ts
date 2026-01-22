import { useCallback, useRef } from "react";
import { ampli, TransferSignedProperties } from "ampli";
import { useAmplitude } from "hooks";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";
import { buildCoreTransferProperties } from "utils/amplitude/transferEventProperties";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import useReferrer from "hooks/useReferrer";

type UseTrackTransferSignedParams = {
  quote: SwapApprovalQuote | undefined;
  quoteRequest: QuoteRequest;
  depositorOrPlaceholder: string;
  recipientOrPlaceholder: string;
  customDestinationAddress: string | undefined;
};

export function useTrackTransferSigned({
  quote,
  quoteRequest,
  depositorOrPlaceholder,
  recipientOrPlaceholder,
  customDestinationAddress,
}: UseTrackTransferSignedParams) {
  const { addToAmpliQueue } = useAmplitude();
  const { referrer } = useReferrer();
  const transferSubmittedTimestampRef = useRef<number>(0);

  const setTransferSubmittedTimestamp = useCallback(() => {
    transferSubmittedTimestampRef.current = Date.now();
  }, []);

  const trackTransferSigned = useCallback(
    (transactionHash: string) => {
      if (!quote) return;

      const signedTimestamp = Date.now();
      const timeFromTransferSubmittedToTransferSignedInMilliseconds =
        transferSubmittedTimestampRef.current > 0
          ? signedTimestamp - transferSubmittedTimestampRef.current
          : 0;

      const sender = depositorOrPlaceholder;
      const recipient = customDestinationAddress ?? recipientOrPlaceholder;

      const coreProperties = buildCoreTransferProperties({
        quote,
        sender,
        recipient,
        tradeType: quoteRequest.tradeType,
      });

      const bridgeFeeDetails = quote.steps.bridge.fees.details;

      const properties: TransferSignedProperties = {
        ...coreProperties,
        transactionHash,
        lpFeeTotal: bridgeFeeDetails?.lp.amount.toString() ?? "0",
        capitalFeeTotal:
          bridgeFeeDetails?.relayerCapital.amount.toString() ?? "0",
        quoteTimestamp: String(transferSubmittedTimestampRef.current),
        totalFeePct: quote.fees?.total.pct?.toString() ?? "0",
        totalFeeUsd: quote.fees?.total.amountUsd ?? "0",
        timeFromTransferSubmittedToTransferSignedInMilliseconds: String(
          timeFromTransferSubmittedToTransferSignedInMilliseconds
        ),
        referralProgramAddress: referrer ?? undefined,
      };

      addToAmpliQueue(() => {
        ampli.transferSigned(properties);
      });
    },
    [
      quote,
      quoteRequest,
      depositorOrPlaceholder,
      recipientOrPlaceholder,
      customDestinationAddress,
      referrer,
      addToAmpliQueue,
    ]
  );

  return { trackTransferSigned, setTransferSubmittedTimestamp };
}
