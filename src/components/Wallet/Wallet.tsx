import { onboard } from "utils";
import React from "react";
import { useConnection, useETHBalance } from "state/hooks";
import {
  DEFAULT_FROM_CHAIN_ID,
  CHAINS,
  shortenAddress,
  formatEther,
} from "utils";
import {
  Wrapper,
  Account,
  Info,
  ConnectButton,
  UnsupportedNetwork,
} from "./Wallet.styles";

const Wallet: React.FC = () => {
  const { account, isConnected, chainId } = useConnection();
  const { init } = onboard;

  const { data: balance } = useETHBalance(
    { account: account ?? "", chainId: chainId ?? DEFAULT_FROM_CHAIN_ID },
    { skip: !isConnected }
  );

  if (account && !isConnected && !chainId) {
    return (
      <UnsupportedNetwork>
        Unsupported Network. Please swap networks.
      </UnsupportedNetwork>
    );
  }

  if (!isConnected) {
    return <ConnectButton onClick={init}>Connect Wallet</ConnectButton>;
  }

  return (
    <Wrapper>
      <Info>
        <div>
          {formatEther(balance ?? "0")}{" "}
          {CHAINS[chainId ?? 1].nativeCurrency.symbol}
        </div>
        <div>{CHAINS[chainId ?? 1].name}</div>
      </Info>
      <Account>{shortenAddress(account ?? "")}</Account>
    </Wrapper>
  );
};
export default Wallet;
