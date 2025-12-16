import { useCallback, useRef } from "react";
import { ampli, TransferFillCompletedProperties } from "ampli";
import { useAmplitude } from "hooks";
import { FromBridgeAndSwapPagePayload } from "utils/local-deposits";
import { buildCoreTransferProperties } from "utils/amplitude/transferEventProperties";

type TrackTransferFillCompletedParams = {
  fillTxHash: string;
  succeeded: boolean;
  fillCompleteTimestamp: number;
  depositCompleteTimestamp: number;
  fillAmount: string;
  totalFilledAmount: string;
};

export function useTrackTransferFillCompleted(
  fromBridgeAndSwapPagePayload: FromBridgeAndSwapPagePayload | undefined
) {
  const { addToAmpliQueue } = useAmplitude();
  const hasTrackedRef = useRef(false);

  const trackTransferFillCompleted = useCallback(
    (params: TrackTransferFillCompletedParams) => {
      if (!fromBridgeAndSwapPagePayload || hasTrackedRef.current) return;
      hasTrackedRef.current = true;

      const {
        fillTxHash,
        succeeded,
        fillCompleteTimestamp,
        depositCompleteTimestamp,
        fillAmount,
        totalFilledAmount,
      } = params;
      const { swapQuote, referrer, tradeType } = fromBridgeAndSwapPagePayload;

      const fillTimeInMs =
        depositCompleteTimestamp > 0
          ? fillCompleteTimestamp - depositCompleteTimestamp
          : 0;

      const sender = fromBridgeAndSwapPagePayload.sender;
      const recipient = fromBridgeAndSwapPagePayload.recipient;

      const coreProperties = buildCoreTransferProperties({
        quote: swapQuote,
        sender,
        recipient,
        tradeType,
      });

      const properties: TransferFillCompletedProperties = {
        ...coreProperties,
        transactionHash: fillTxHash,
        succeeded,
        fillCompleteTimestamp: String(fillCompleteTimestamp),
        depositCompleteTimestamp: String(depositCompleteTimestamp),
        fillTimeInMs: String(fillTimeInMs),
        fillAmount,
        fillAmountUsd: swapQuote.fees?.total.amountUsd ?? "0",
        totalFilledAmount,
        totalFilledAmountUsd: swapQuote.fees?.total.amountUsd ?? "0",
        totalFeePct: swapQuote.fees?.total.pct?.toString() ?? "0",
        totalFeeUsd: swapQuote.fees?.total.amountUsd ?? "0",
        referralProgramAddress: referrer || undefined,
      };

      addToAmpliQueue(() => {
        ampli.transferFillCompleted(properties);
      });
    },
    [fromBridgeAndSwapPagePayload, addToAmpliQueue]
  );

  return { trackTransferFillCompleted };
}
