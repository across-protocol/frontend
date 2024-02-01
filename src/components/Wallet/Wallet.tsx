import { FC } from "react";

import { useConnection } from "hooks";
import { shortenAddress, isSupportedChainId, SHOW_ACX_NAV_TOKEN } from "utils";

import {
  ConnectButton,
  UnsupportedNetwork,
  BalanceButton,
  Logo,
  BalanceWallet,
  Account,
  Separator,
  WalletWrapper,
} from "./Wallet.styles";
import Web3Subscribe from "./Web3Subscribe";

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
          connect({ trackSection: "navbar" });
        }}
      >
        Connect
      </ConnectButton>
    );
  }

  return (
    <WalletWrapper>
      <Web3Subscribe />
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
            <Account data-cy="wallet-address">
              {ensName ?? shortenAddress(account, "..", 4)}
            </Account>
          </>
        )}
      </BalanceButton>
    </WalletWrapper>
  );
};
export default Wallet;
