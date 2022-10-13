import { useConnection } from "hooks";

export function useRewards() {
  const { isConnected, connect, account } = useConnection();

  return {
    isConnected,
    address: account,
    connectHandler: () => connect(),
  };
}
