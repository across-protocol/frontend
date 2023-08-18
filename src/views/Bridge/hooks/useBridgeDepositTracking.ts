import { useConnection } from "hooks";
import { useCallback, useEffect, useState } from "react";
import { formatMilliseconds, getChainInfo } from "utils";

export function useBridgeDepositTracking() {
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [depositFinishedDate, setDepositFinishedDate] = useState<
    Date | undefined
  >(undefined);
  const [internalChainId, setInternalChainId] = useState<number | undefined>();
  const { chainId } = useConnection();

  const explorerUrl =
    txHash && internalChainId
      ? getChainInfo(internalChainId).constructExplorerLink(txHash)
      : undefined;

  useEffect(() => {
    setStartDate(txHash ? new Date() : undefined);
    setInternalChainId(txHash ? chainId : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txHash]);

  const handleTransactionCompleted = (success: boolean) => {
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

  const handleTxHashChange = useCallback(
    (txHash?: string) => {
      setTxHash(txHash);
      setDepositFinishedDate(undefined);
    },
    [setTxHash, setDepositFinishedDate]
  );

  return {
    txHash,
    handleTxHashChange,
    explorerUrl,
    trackingTxHash,
    transactionPending: !depositFinished,
    transactionElapsedSeconds: elapsedSeconds,
    transactionElapsedTimeAsFormattedString: elapsedTimeAsFormattedString,
    handleTransactionCompleted,
  };
}
