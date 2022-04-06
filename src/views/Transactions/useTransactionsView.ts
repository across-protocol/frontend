import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { onboard } from "utils";
import createTransactionModel from "./TransactionsTable/createTransactionModel";
import useWindowSize from "hooks/useWindowsSize";
import txHistoryClient from "state/transferHistory";
import { transfersHistory } from "@across-protocol/sdk-v2";

export default function useTransactionsView() {
  const { provider, chainId, isConnected, account } = useConnection();
  const { init } = onboard;
  const transactions = createTransactionModel();

  const { width } = useWindowSize();
  const [openFilledRow, setOpenFilledRow] = useState<number>(-1);
  const [openOngoingRow, setOpenOngoingRow] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(0);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (account) {
      console.log("account", account);
      const started = startFetchingTransfers(account).then((res) => {
        if (res) {
          interval = setInterval(() => {
            console.log(
              "txHistoryClient",
              txHistoryClient.getFilledTransfers(account)
            );
          }, 10000);
        }
      });

      txHistoryClient.on(
        transfersHistory.TransfersHistoryEvent.TransfersUpdated,
        (data) => {
          const { depositorAddr, filledTransfersCount, pendingTransfersCount } =
            data;
          console.log("hello?", data);
        }
      );
    }
    return () => {
      clearInterval(interval);
      if (account) {
        txHistoryClient.stopFetchingTransfers(account);
      }
    };
  }, [account]);
  return {
    provider,
    chainId,
    isConnected,
    account,
    initOnboard: init,
    transactions,
    // windowSize can return undefined -- default to 0 for easier typing.
    width: width || 0,
    openFilledRow,
    setOpenFilledRow,
    openOngoingRow,
    setOpenOngoingRow,
    currentPage,
    setCurrentPage,
    txHistoryClient,
  };
}

async function startFetchingTransfers(account: string) {
  try {
    await txHistoryClient.startFetchingTransfers(account);
    return true;
  } catch (err) {
    console.log("err", err);
    return null;
  }
}

export const CLOSED_DROPDOWN_INDEX = -1;
