import { onboard } from "utils";
import { FC } from "react";
import { useConnection } from "state/hooks";

import {
  Wrapper,
  ConnectButton,
  UnsupportedNetwork,
  BalanceButton,
  Logo,
  BalanceWallet,
  Account,
} from "./Wallet.styles";
import { shortenAddress } from "utils";

const { init } = onboard;

interface Props {
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Wallet: FC<Props> = ({ setOpenSidebar }) => {
  const { account, ensName, isConnected, chainId } = useConnection();

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

  if (account && !isConnected && !chainId) {
    return (
      <UnsupportedNetwork>
        Unsupported network. Please change networks.
      </UnsupportedNetwork>
    );
  }
  return (
    <Wrapper onClick={() => setOpenSidebar(true)}>
      <BalanceButton>
        <div>
          <Logo />
          <BalanceWallet>0 ACX</BalanceWallet>
        </div>
        {/* <div>

        </div> */}
        {account && (
          <Account>{ensName ?? shortenAddress(account, "...", 4)}</Account>
        )}
      </BalanceButton>
    </Wrapper>
  );
};
export default Wallet;
