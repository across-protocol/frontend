import { useConnection } from "hooks";
import { useTransaction } from "hooks/useTransaction";
import { useEffect, useState } from "react";

export function useBridgeDepositTracking() {
  const [txHash, setTxHash] = useState<string | undefined>(
    "0x3a63779018d070a7e9c8777c87a3e76b51df485458dab4440e3679e596c2633d"
  );
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
    setDepositFinishedDate(
      receipt && receipt.status === 1 ? new Date() : undefined
    );
  }, [receipt]);

  const trackingTxHash = !!txHash;
  const elapsedSeconds = startDate
    ? Math.floor(
        ((depositFinishedDate?.getTime() ?? new Date().getTime()) -
          startDate.getTime()) /
          1000
      )
    : undefined;
  const depositFinished = !!depositFinishedDate;

  const onTxHashChange = (txHash: string) => {
    setTxHash(txHash);
  };

  return {
    txHash,
    onTxHashChange,
    receipt,
    explorerUrl,
    trackingTxHash,
    transactionCompleted: depositFinished,
    transactionElapsedSeconds: elapsedSeconds,
  };
}
