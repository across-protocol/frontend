import { SecondaryButton } from "components";
import { useOnboard } from "hooks";
import React from "react";
import { useConnection, useETHBalance } from "state/hooks";
import {
  DEFAULT_FROM_CHAIN_ID,
  CHAINS,
  shortenAddress,
  formatEther,
} from "utils";
import { Wrapper, Account, Info } from "./Wallet.styles";

const Wallet: React.FC = () => {
  const { account, isConnected, chainId } = useConnection();
  const { init } = useOnboard();

  const { data: balance } = useETHBalance(
    { account: account ?? "", chainId: chainId ?? DEFAULT_FROM_CHAIN_ID },
    { skip: !isConnected }
  );

  if (!isConnected || !account || !chainId) {
    return <SecondaryButton onClick={init}>Connect Wallet</SecondaryButton>;
  }

  return (
    <Wrapper>
      <Info>
        <div>
          {formatEther(balance ?? "0")} {CHAINS[chainId].nativeCurrency.symbol}
        </div>
        <div>{CHAINS[chainId].name}</div>
      </Info>
      <Account>{shortenAddress(account)}</Account>
    </Wrapper>
  );
};
export default Wallet;
