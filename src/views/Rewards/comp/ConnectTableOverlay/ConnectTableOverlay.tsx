import { Overlay, ConnectButton } from "./ConnectTableOverlay.styles";
import { useConnection } from "state/hooks";

const ConnectTableOverlay = () => {
  const { connect } = useConnection();
  return (
    <Overlay>
      <ConnectButton size="md" onClick={() => connect()}>
        Connect to track referral transfers
      </ConnectButton>
    </Overlay>
  );
};

export default ConnectTableOverlay;
