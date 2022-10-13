import { useConnection } from "hooks";

export function useRewards() {
  const { isConnected, connect, account } = useConnection();

  return {
    isConnected,
    address: account,
    connectHandler: () => connect(),
    totalRewards: "726.45 ACX",
    stakedTokens: "$942,021.23",
    referralTier: 1,
  };
}
