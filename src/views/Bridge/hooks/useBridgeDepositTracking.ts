import { useConnection } from "hooks";
import { useTransaction } from "hooks/useTransaction";
import { useEffect, useState } from "react";
import { formatSeconds } from "utils";

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

  useEffect(() => {
    if (!depositFinishedDate) {
      setDepositFinishedDate(
        receipt && receipt.status === 1 ? new Date() : undefined
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt]);

  const [elapsedSeconds, setElapsedSeconds] = useState<number | undefined>();

  useEffect(() => {
    if (startDate) {
      const interval = setInterval(() => {
        setElapsedSeconds(
          Math.floor(
            ((depositFinishedDate ?? new Date()).getTime() -
              startDate.getTime()) /
              1000
          )
        );
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(undefined);
    }
  }, [startDate, depositFinishedDate]);

  const trackingTxHash = !!txHash;
  const elapsedTimeAsFormattedString = formatSeconds(elapsedSeconds);
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
  };
}
