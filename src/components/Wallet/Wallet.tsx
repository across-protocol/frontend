import { FC } from "react";

import { useConnection } from "hooks";
import {
  shortenAddress,
  isSupportedChainId,
  SHOW_ACX_NAV_TOKEN,
  getPageValue,
} from "utils";
import { ampli } from "ampli";

import {
  ConnectButton,
  UnsupportedNetwork,
  BalanceButton,
  Logo,
  BalanceWallet,
  Account,
  Separator,
} from "./Wallet.styles";

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
      <ConnectButton
        data-cy="wallet-connect-button"
        onClick={() => {
          connect();
          ampli.connectWalletButtonClicked({
            action: "onClick",
            element: "connectWalletButton",
            page: getPageValue(),
            section: "navbar",
          });
        }}
      >
        Connect
      </ConnectButton>
    );
  }

  return (
    <BalanceButton onClick={() => setOpenSidebar(true)} data-cy="acx-balance">
      {SHOW_ACX_NAV_TOKEN && (
        <>
          <Logo />
          <BalanceWallet>0 ACX</BalanceWallet>
        </>
      )}
      {account && (
        <>
          {SHOW_ACX_NAV_TOKEN && <Separator />}
          <Account>{ensName ?? shortenAddress(account, "..", 4)}</Account>
        </>
      )}
    </BalanceButton>
  );
};
export default Wallet;
