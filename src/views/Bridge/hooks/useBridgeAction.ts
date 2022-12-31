import { useConnection } from "hooks";

export function useBridgeAction() {
  const { isConnected, connect } = useConnection();
  const connectionHandler = () => {
    connect();
  };
  const buttonActionHandler = !isConnected ? connectionHandler : () => {};
  const buttonLabel = !isConnected ? "Connect wallet" : "Confirm transaction";

  return {
    isConnected,
    buttonActionHandler,
    buttonLabel,
  };
}
