import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { onboard } from "utils";
import useWindowSize from "hooks/useWindowsSize";
import getTxClient from "state/transferHistory";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history/model";
import { transfersHistory } from "@across-protocol/sdk-v2";

export default function useTransactionsView() {
  const { provider, chainId, isConnected, account } = useConnection();
  const { init } = onboard;

  const { width } = useWindowSize();
  const [openFilledRow, setOpenFilledRow] = useState<number>(-1);
  const [openOngoingRow, setOpenOngoingRow] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(0);
  const [rawFilledTx, setRawFilledTx] = useState<Transfer[]>([]);
  const [rawOngoingTx, setRawOngoingTx] = useState<Transfer[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [txClient] = useState(getTxClient);
  // Start the tracking / stopping of the TX in the client.

  useEffect(() => {
    if (txClient) {
      txClient.on(
        transfersHistory.TransfersHistoryEvent.TransfersUpdated,
        (data) => {
          setInitialLoading(false);
          const nextFilledTx = txClient.getFilledTransfers(data.depositorAddr);
          const nextOngoingTx = txClient.getPendingTransfers(
            data.depositorAddr
          );
          setRawFilledTx(nextFilledTx);
          setRawOngoingTx(nextOngoingTx);
        }
      );
    }
  }, [txClient]);

  useEffect(() => {
    if (account && txClient) {
      setInitialLoading(true);
      txClient.startFetchingTransfers(account).catch((err) => {
        console.error(
          "Error in txHistoryClient::startFetchingTransfers call",
          err
        );
      });
    }

    return () => {
      if (account && txClient) {
        txClient.stopFetchingTransfers(account);
        setRawFilledTx([]);
        setRawOngoingTx([]);
      }
    };
  }, [account, txClient]);

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
    rawFilledTx,
    rawOngoingTx,
    initialLoading,
  };
}

export const CLOSED_DROPDOWN_INDEX = -1;
