import { useConnection } from "hooks";
import { useTransaction } from "hooks/useTransaction";
import { useEffect, useState } from "react";
import { formatMilliseconds } from "utils";

export function useBridgeDepositTracking() {
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [depositFinishedDate, setDepositFinishedDate] = useState<
    Date | undefined
  >(undefined);
  const { chainId } = useConnection();
  const { receipt, explorerUrl } = useTransaction(chainId || 1, txHash);

  useEffect(() => {
    setStartDate(txHash ? new Date() : undefined);
  }, [txHash]);

  const onTransactionCompleted = (success: boolean) => {
    setDepositFinishedDate(success ? new Date() : undefined);
  };

  const [elapsedSeconds, setElapsedSeconds] = useState<number | undefined>();

  useEffect(() => {
    if (startDate) {
      const interval = setInterval(() => {
        setElapsedSeconds(
          ((depositFinishedDate ?? new Date()).getTime() -
            startDate.getTime()) /
            1000
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(undefined);
    }
  }, [startDate, depositFinishedDate]);

  const trackingTxHash = !!txHash;
  const elapsedTimeAsFormattedString = formatMilliseconds(
    Math.floor((elapsedSeconds ?? 0) * 1000)
  );
  const depositFinished = !!depositFinishedDate;

  const onTxHashChange = (txHash?: string) => {
    setTxHash(txHash);
  };

  return {
    txHash,
    onTxHashChange,
    receipt,
    explorerUrl,
    trackingTxHash,
    transactionPending: !depositFinished,
    transactionElapsedSeconds: elapsedSeconds,
    transactionElapsedTimeAsFormattedString: elapsedTimeAsFormattedString,
    txCompletedHandler: onTransactionCompleted,
  };
}
