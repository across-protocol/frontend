import { onboard } from "utils";
import { FC } from "react";
import { useConnection } from "state/hooks";
import { useBalanceBySymbol } from "hooks";

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
  const { account, isConnected, chainId } = useConnection();
  const config = getConfig();
  const nativeToken = chainId ? config.getNativeTokenInfo(chainId) : undefined;
  const chain = chainId ? getChainInfo(chainId) : undefined;

  const { balance } = useBalanceBySymbol(nativeToken?.symbol, chainId, account);

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
      {account && <Account>{shortenAddress(account, "...", 4)}</Account>}
    </Wrapper>
  );
};
export default Wallet;
