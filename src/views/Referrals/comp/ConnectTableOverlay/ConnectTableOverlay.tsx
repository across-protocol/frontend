import { Overlay, ConnectButton } from "./ConnectTableOverlay.styles";
import { useConnection } from "hooks";
import { trackConnectWalletButtonClicked } from "utils";

const ConnectTableOverlay = () => {
  const { connect } = useConnection();
  return (
    <Overlay>
      <ConnectButton
        size="md"
        onClick={() => {
          connect();
          trackConnectWalletButtonClicked("referralTable");
        }}
      >
        Connect to track referral transfers
      </ConnectButton>
    </Overlay>
  );
};

export default ConnectTableOverlay;
