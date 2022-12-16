import { useConnection } from "hooks";
import useWindowSize from "hooks/useWindowSize";
import { BREAKPOINTS, getPageValue } from "utils";
import { ampli } from "ampli";

import { useTxClient } from "./useTxClient";
import { usePagination } from "./usePagination";

export function useMyTransactionsView() {
  const { initialLoading, filledTransferTuples, pendingTransferTuples } =
    useTxClient();
  const { isConnected, account, connect } = useConnection();

  const { width = 0 } = useWindowSize();
  const isMobile = width < BREAKPOINTS.laptopMin;

  const filledTransfersPagination = usePagination(filledTransferTuples.length);

  return {
    connectWallet: () => {
      connect();
      ampli.connectWalletButtonClicked({
        action: "onClick",
        element: "connectWalletButton",
        page: getPageValue(),
        section: "myTransactionsTable",
      });
    },
    account,
    initialLoading,
    pendingTransferTuples,
    filledTransferTuples,
    isConnected,
    isMobile,
    filledTransfersPagination,
  };
}
