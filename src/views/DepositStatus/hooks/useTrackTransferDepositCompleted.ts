import { useCallback, useRef } from "react";
import { ampli, TransferDepositCompletedProperties } from "ampli";
import { useAmplitude } from "hooks/useAmplitude";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";
import { buildCoreTransferProperties } from "utils/amplitude/transferEventProperties";

type TrackTransferDepositCompletedParams = {
  transactionHash: string;
  succeeded: boolean;
  depositCompleteTimestamp: number;
};

export function useTrackTransferDepositCompleted(
  fromBridgeAndSwapPagePayload: FromBridgeAndSwapPagePayload | undefined
) {
  const { addToAmpliQueue } = useAmplitude();
  const hasTrackedRef = useRef(false);

  const trackTransferDepositCompleted = useCallback(
    (params: TrackTransferDepositCompletedParams) => {
      // If we do not have a fromBridgeAndSwapPagePayload here, it means that the
      // user has Access the page through the URL and not through the in-app
      // rounding, and we do not want to track the event.
      if (!fromBridgeAndSwapPagePayload || hasTrackedRef.current) return;
      hasTrackedRef.current = true;

      const { transactionHash, succeeded, depositCompleteTimestamp } = params;
      const { swapQuote, timeSigned, referrer, tradeType } =
        fromBridgeAndSwapPagePayload;

      const timeFromTransferSignedToTransferCompleteInMilliseconds =
        timeSigned > 0 ? depositCompleteTimestamp - timeSigned : 0;

      const sender = fromBridgeAndSwapPagePayload.sender;
      const recipient = fromBridgeAndSwapPagePayload.recipient;

      const coreProperties = buildCoreTransferProperties({
        quote: swapQuote,
        sender,
        recipient,
        tradeType,
      });

      const properties: TransferDepositCompletedProperties = {
        ...coreProperties,
        swapType:
          coreProperties.swapType as TransferDepositCompletedProperties["swapType"],
        transactionHash,
        succeeded,
        depositCompleteTimestamp: String(depositCompleteTimestamp),
        timeFromTransferSignedToTransferCompleteInMilliseconds: String(
          timeFromTransferSignedToTransferCompleteInMilliseconds
        ),
        quoteTimestamp: String(timeSigned),
        totalFeePct: swapQuote.fees?.total.pct?.toString() ?? "0",
        totalFeeUsd: swapQuote.fees?.total.amountUsd ?? "0",
        referralProgramAddress: referrer || undefined,
      };

      addToAmpliQueue(() => {
        ampli.transferDepositCompleted(properties);
      });
    },
    [fromBridgeAndSwapPagePayload, addToAmpliQueue]
  );

  return { trackTransferDepositCompleted };
}
