import { useConnection } from "state/hooks";
import { onboard } from "utils";
import createTransactionModel from "./TransactionsTable/createTransactionModel";
import useWindowSize from "hooks/useWindowsSize";

export default function useTransactionsView() {
  const { provider, chainId, isConnected, account } = useConnection();
  const { init } = onboard;
  const transactions = createTransactionModel();

  const { width } = useWindowSize();
  return {
    provider,
    chainId,
    isConnected,
    account,
    initOnboard: init,
    transactions,
    // windowSize can return undefined -- default to 0 for easier typing.
    width: width || 0,
  };
}
