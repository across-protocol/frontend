import { Overlay, ConnectButton } from "./ConnectTableOverlay.styles";
import { useConnection } from "hooks";
import { ampli } from "ampli";
import { getPageValue } from "utils";

const ConnectTableOverlay = () => {
  const { connect } = useConnection();
  return (
    <Overlay>
      <ConnectButton
        size="md"
        onClick={() => {
          connect();
          ampli.connectWalletButtonClicked({
            action: "onClick",
            element: "connectWalletButton",
            page: getPageValue(),
            section: "referralTable",
          });
        }}
      >
        Connect to track referral transfers
      </ConnectButton>
    </Overlay>
  );
};

export default ConnectTableOverlay;
