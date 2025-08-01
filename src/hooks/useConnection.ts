import { useConnectionEVM } from "./useConnectionEVM";

export function useConnection() {
  const connectionEVM = useConnectionEVM();
  return connectionEVM;
}
