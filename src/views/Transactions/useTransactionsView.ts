import { useState } from "react";
import { useConnection } from "state/hooks";
import { onboard } from "utils";

export default function useTransactionsView() {
  const [transactions] = useState([]);
  const { provider, chainId, isConnected, account } = useConnection();
  const { init } = onboard;

  return {
    transactions,
    provider,
    chainId,
    isConnected,
    account,
    initOnboard: init,
  };
}
