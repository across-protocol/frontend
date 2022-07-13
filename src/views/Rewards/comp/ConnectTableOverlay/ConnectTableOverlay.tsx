import { Overlay, ConnectButton } from "./ConnectTableOverlay.styles";
import { onboard } from "utils";

const { init } = onboard;

const ConnectTableOverlay = () => {
  return (
    <Overlay>
      <ConnectButton size="md" onClick={() => init()}>
        Connect to track your referral transfers
      </ConnectButton>
    </Overlay>
  );
};

export default ConnectTableOverlay;
