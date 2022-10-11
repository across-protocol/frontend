import { useState, useEffect } from "react";
import { transfersHistory } from "@across-protocol/sdk-v2";

import { useConnection } from "state/hooks";
import getTxClient from "state/transferHistory";
import { getSupportedTxTuples } from "../utils";

import { SupportedTxTuple } from "../types";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history";

const MAX_TIME_FOR_FETCHING_TX = 5 * 60 * 1000;

export function useTxClient() {
  const { account } = useConnection();

  const [filledTransferTuples, setFilledTransferTuples] = useState<
    SupportedTxTuple[]
  >([]);
  const [pendingTransferTuples, setPendingTransferTuples] = useState<
    SupportedTxTuple[]
  >([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [txClient] = useState(getTxClient);
  // Start the tracking / stopping of the TX in the client.
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>();

  useEffect(() => {
    if (txClient) {
      txClient.on(
        transfersHistory.TransfersHistoryEvent.TransfersUpdated,
        (data) => {
          setInitialLoading(false);
          const nextFilledTransfers = txClient.getFilledTransfers(
            data.depositorAddr
          );
          const nextPendingTransfers = txClient.getPendingTransfers(
            data.depositorAddr
          );
          setFilledTransferTuples((prevFilledTransfers) =>
            getUpdatedTransferTuples(prevFilledTransfers, nextFilledTransfers)
          );
          setPendingTransferTuples((prevPendingTransfers) =>
            getUpdatedTransferTuples(prevPendingTransfers, nextPendingTransfers)
          );
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
      // start timer that stops fetching events after a certain time
      const timeout = setTimeout(() => {
        txClient.stopFetchingTransfers(account);
        setTimer(undefined);
      }, MAX_TIME_FOR_FETCHING_TX);
      setTimer(timeout);
    }

    return () => {
      if (account && txClient) {
        txClient.stopFetchingTransfers(account);
        setFilledTransferTuples([]);
        setPendingTransferTuples([]);
      }
    };
  }, [account, txClient]);

  useEffect(() => {
    return () => {
      // inside the cleanup function make sure that the old timer
      // is cleared after setting up a new timer
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);

  return {
    filledTransferTuples,
    pendingTransferTuples,
    initialLoading,
  };
}

/**
 * Makes sure to only set state if new transfers received.
 * Prevents unnecessary re-renders.
 */
function getUpdatedTransferTuples(
  prevTransferTuples: SupportedTxTuple[],
  nextTransfers: Transfer[]
) {
  const nextTransferTuples = getSupportedTxTuples(nextTransfers);

  if (prevTransferTuples.length !== nextTransferTuples.length) {
    return nextTransferTuples;
  }

  return prevTransferTuples;
}
