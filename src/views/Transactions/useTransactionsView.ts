import { useConnection } from "state/hooks";
import { onboard } from "utils";

export default function useTransactionsView() {
  const { provider, chainId, isConnected, account } = useConnection();
  const { init } = onboard;

  return {
    provider,
    chainId,
    isConnected,
    account,
    initOnboard: init,
  };
}
