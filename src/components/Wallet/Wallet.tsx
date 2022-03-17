import { onboard } from "utils";
import { FC } from "react";
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

const { init } = onboard;

interface Props {
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const Wallet: FC<Props> = ({ setOpenSidebar }) => {
  const { account, isConnected, chainId } = useConnection();

  const { data: balance } = useETHBalance(
    { account: account ?? "", chainId: chainId ?? DEFAULT_FROM_CHAIN_ID },
    { skip: !isConnected }
  );

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
      <Info>
        {chainId && (
          <>
            <div>
              {formatEther(balance ?? "0")}{" "}
              {CHAINS[chainId].nativeCurrency.symbol}
            </div>
            <div>{CHAINS[chainId].name}</div>
          </>
        )}
      </Info>
      <Account>{shortenAddress(account ?? "", "...", 4)}</Account>
    </Wrapper>
  );
};
export default Wallet;
