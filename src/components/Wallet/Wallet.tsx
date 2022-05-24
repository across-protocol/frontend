import { onboard } from "utils";
import { FC } from "react";
import { useConnection } from "state/hooks";
import { useNativeBalance } from "hooks";

import { getChainInfo, shortenAddress, formatEther, getConfig } from "utils";

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
  const { account, ensName, isConnected, chainId } = useConnection();
  const config = getConfig();
  const nativeToken = chainId ? config.getNativeTokenInfo(chainId) : undefined;
  const chain = chainId ? getChainInfo(chainId) : undefined;

  const { balance } = useNativeBalance(nativeToken?.symbol, chainId, account);

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
        {nativeToken && chain && (
          <>
            <div>
              {formatEther(balance ?? "0")} {nativeToken.symbol}
            </div>
            <div>{chain.name}</div>
          </>
        )}
      </Info>
      {account && (
        <Account>{ensName ?? shortenAddress(account, "...", 4)}</Account>
      )}
    </Wrapper>
  );
};
export default Wallet;
