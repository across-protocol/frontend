import { FC } from "react";
import { useConnection } from "hooks";

import {
  ConnectButton,
  UnsupportedNetwork,
  BalanceButton,
  Logo,
  BalanceWallet,
  Account,
  Separator,
} from "./Wallet.styles";
import { shortenAddress, isSupportedChainId } from "utils";

interface Props {
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Wallet: FC<Props> = ({ setOpenSidebar }) => {
  const { account, ensName, isConnected, chainId, connect } = useConnection();

  if (account && !isSupportedChainId(chainId)) {
    return (
      <UnsupportedNetwork data-cy="unsupported-network">
        Unsupported network. Please change networks.
      </UnsupportedNetwork>
    );
  }

  if (!isConnected) {
    return (
      <ConnectButton data-cy="wallet-connect-button" onClick={() => connect()}>
        Connect
      </ConnectButton>
    );
  }

  return (
    <BalanceButton onClick={() => setOpenSidebar(true)} data-cy="acx-balance">
      <Logo />
      <BalanceWallet>0 ACX</BalanceWallet>
      {account && (
        <>
          <Separator />
          <Account>{ensName ?? shortenAddress(account, "..", 4)}</Account>
        </>
      )}
    </BalanceButton>
  );
};
export default Wallet;
