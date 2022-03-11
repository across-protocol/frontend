import { useConnection } from "state/hooks";
import { onboard } from "utils";
import createTransactionModel from "./createTransactionModel";

export default function useTransactionsView() {
  const { provider, chainId, isConnected, account } = useConnection();
  const { init } = onboard;
  const transactions = createTransactionModel();

  return {
    provider,
    chainId,
    isConnected,
    account,
    initOnboard: init,
    transactions,
  };
}
