import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { onboard } from "utils";
import useWindowSize from "hooks/useWindowsSize";
import txHistoryClient from "state/transferHistory";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history/model";
import { transfersHistory } from "@across-protocol/sdk-v2";
import { usePrevious } from "hooks";
export default function useTransactionsView() {
  const { provider, chainId, isConnected, account } = useConnection();
  const { init } = onboard;

  const { width } = useWindowSize();
  const [openFilledRow, setOpenFilledRow] = useState<number>(-1);
  const [openOngoingRow, setOpenOngoingRow] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(0);
  const [rawFilledTx, setRawFilledTx] = useState<Transfer[]>([]);
  const [rawOngoingTx, setRawOngoingTx] = useState<Transfer[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Start the tracking / stopping of the TX in the client.
  const previousAccount = usePrevious(account);
  useEffect(() => {
    if (account && initialLoading) {
      txHistoryClient.startFetchingTransfers(account).catch((err) => {
        console.error(
          "Error in startFetchingTransfers call in txHistoryClient",
          err
        );
      });
      txHistoryClient.on(
        transfersHistory.TransfersHistoryEvent.TransfersUpdated,
        (data) => {
          if (initialLoading) setInitialLoading(false);

          const nextFilledTx = txHistoryClient.getFilledTransfers(
            data.depositorAddr
          );
          const nextOngoingTx = txHistoryClient.getPendingTransfers(
            data.depositorAddr
          );

          setRawFilledTx(nextFilledTx);
          setRawOngoingTx(nextOngoingTx);
        }
      );
      return () => {
        txHistoryClient.stopFetchingTransfers(account);
        setRawFilledTx([]);
        setRawOngoingTx([]);
      };
    }

    if (!account || (previousAccount && previousAccount !== account)) {
      setInitialLoading(true);
      setRawFilledTx([]);
      setRawOngoingTx([]);
    }
  }, [account, initialLoading, setInitialLoading, previousAccount]);

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
    initialLoading,
  };
}

export const CLOSED_DROPDOWN_INDEX = -1;
