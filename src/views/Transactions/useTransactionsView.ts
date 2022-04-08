import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { onboard } from "utils";
import useWindowSize from "hooks/useWindowsSize";
import txHistoryClient from "state/transferHistory";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history/model";

export default function useTransactionsView() {
  const { provider, chainId, isConnected, account } = useConnection();
  const { init } = onboard;

  const { width } = useWindowSize();
  const [openFilledRow, setOpenFilledRow] = useState<number>(-1);
  const [openOngoingRow, setOpenOngoingRow] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(0);
  const [rawFilledTx, setRawFilledTx] = useState<Transfer[]>([]);
  const [rawOngoingTx, setRawOngoingTx] = useState<Transfer[]>([]);

  // Start the tracking / stopping of the TX in the client.
  useEffect(() => {
    if (account) {
      txHistoryClient.startFetchingTransfers(account).catch((err) => {
        console.error(
          "Error in startFetchingTransfers call in txHistoryClient",
          err
        );
      });
    }
    return () => {
      if (account) {
        txHistoryClient.stopFetchingTransfers(account);
      }
    };
  }, [account]);

  // Create interval to update transactions.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (account) {
      interval = setInterval(() => {
        const nextFilledTx = txHistoryClient.getFilledTransfers(account);
        const nextOngoingTx = txHistoryClient.getPendingTransfers(account);
        setRawFilledTx(nextFilledTx);
        setRawOngoingTx(nextOngoingTx);
      }, 5000);
    }
    return () => {
      setRawFilledTx([]);
      setRawOngoingTx([]);
      clearInterval(interval);
    };
  }, [account]);

  return {
    provider,
    chainId,
    isConnected,
    account,
    initOnboard: init,
    // windowSize can return undefined -- default to 0 for easier typing.
    width: width || 0,
    openFilledRow,
    setOpenFilledRow,
    openOngoingRow,
    setOpenOngoingRow,
    currentPage,
    setCurrentPage,
    txHistoryClient,
    rawFilledTx,
    rawOngoingTx,
  };
}

export const CLOSED_DROPDOWN_INDEX = -1;
