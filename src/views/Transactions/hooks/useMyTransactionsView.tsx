import { useConnection } from "state/hooks";
import useWindowSize from "hooks/useWindowsSize";
import { onboard, BREAKPOINTS } from "utils";

import { useTxClient } from "./useTxClient";
import { usePagination } from "./usePagination";

export function useMyTransactionsView() {
  const { init } = onboard;
  const { initialLoading, filledTransferTuples, pendingTransferTuples } =
    useTxClient();
  const { isConnected, account } = useConnection();

  const { width = 0 } = useWindowSize();
  const isMobile = width < BREAKPOINTS.laptopMin;

  const filledTransfersPagination = usePagination(filledTransferTuples.length);

  return {
    connectWallet: init,
    account,
    initialLoading,
    pendingTransferTuples,
    filledTransferTuples,
    isConnected,
    isMobile,
    filledTransfersPagination,
  };
}
