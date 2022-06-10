import { onboard } from "utils";
import { FC } from "react";
import { useConnection } from "state/hooks";

import {
  Wrapper,
  ConnectButton,
  UnsupportedNetwork,
  BalanceButton,
  Logo,
} from "./Wallet.styles";

const { init } = onboard;

interface Props {
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Wallet: FC<Props> = ({ setOpenSidebar }) => {
  const { account, isConnected, chainId } = useConnection();

  if (account && !isConnected && !chainId) {
    return (
      <UnsupportedNetwork>
        Unsupported network. Please change networks.
      </UnsupportedNetwork>
    );
  }

  if (!isConnected) {
    return <ConnectButton onClick={init}>Connect Wallet</ConnectButton>;
  }
  return (
    <Wrapper onClick={() => setOpenSidebar(true)}>
      <BalanceButton>
        <Logo />

        <span>Balance: 0 ACX</span>
      </BalanceButton>
    </Wrapper>
  );
};
export default Wallet;
