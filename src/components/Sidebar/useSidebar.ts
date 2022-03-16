import { useConnection } from "state/hooks";
import { useLocation } from "react-router-dom";

export default function useSidebar() {
  const { account, isConnected, chainId } = useConnection();
  const location = useLocation();
  return {
    account,
    isConnected,
    chainId,
    location,
  };
}
