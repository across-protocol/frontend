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
  const { explorerUrl } = useTransaction(chainId || 1, txHash);

  useEffect(() => {
    setStartDate(txHash ? new Date() : undefined);
    setDepositFinishedDate(undefined);
  }, [txHash]);

  const trackingTxHash = !!txHash;
  const elapsedSeconds = startDate
    ? Math.floor(
        ((depositFinishedDate ?? new Date()).getTime() - startDate.getTime()) /
          1000
      )
    : undefined;
  const elapsedTimeAsFormattedString = formatSeconds(elapsedSeconds);
  const depositFinished = !!depositFinishedDate;

  const onTxHashChange = (txHash?: string) => {
    setTxHash(txHash);
  };

  const onDepositResolved = (success: boolean) => {
    setDepositFinishedDate(success ? new Date() : undefined);
  };

  return {
    txHash,
    onTxHashChange,
    explorerUrl,
    trackingTxHash,
    transactionPending: !depositFinished,
    transactionElapsedSeconds: elapsedSeconds,
    transactionElapsedTimeAsFormattedString: elapsedTimeAsFormattedString,
    onDepositResolved,
  };
}
