import { useConnection } from "hooks";
import {
  shortenAddress,
  isSupportedChainId,
  SHOW_ACX_NAV_TOKEN,
  getChainInfo,
} from "utils";

import {
  ConnectButton,
  UnsupportedNetwork,
  BalanceButton,
  Logo,
  BalanceWallet,
  Separator,
  WalletWrapper,
  ConnectedAccountChainLogoContainer,
  ConnectedAccountContainer,
} from "./Wallet.styles";
import Web3Subscribe from "./Web3Subscribe";
import { useEnsQuery } from "hooks/useEns";
import { useSidebarContext } from "hooks/useSidebarContext";
import { Text } from "components/Text";

const Wallet = () => {
  const { account, isConnected, chainId, connect } = useConnection();
  const {
    data: { ensName },
  } = useEnsQuery(account);
  const { openSidebar } = useSidebarContext();

  const chainInfo = isSupportedChainId(chainId)
    ? getChainInfo(chainId)
    : {
        name: "Unsupported Network",
        logoURI: "",
      };

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
      <BalanceButton onClick={() => openSidebar()} data-cy="acx-balance">
        {SHOW_ACX_NAV_TOKEN && (
          <>
            <Logo />
            <BalanceWallet>0 ACX</BalanceWallet>
          </>
        )}
        {account && (
          <>
            {SHOW_ACX_NAV_TOKEN && <Separator />}
            <ConnectedAccount
              chainLogoUrl={chainInfo.logoURI}
              chainName={chainInfo.name}
              address={account}
              ensName={ensName}
            />
          </>
        )}
      </BalanceButton>
    </WalletWrapper>
  );
};

const ConnectedAccount = (props: {
  chainLogoUrl: string;
  chainName: string;
  address: string;
  ensName?: string | null;
}) => {
  return (
    <ConnectedAccountContainer>
      <ConnectedAccountChainLogoContainer>
        <img src={props.chainLogoUrl} alt={props.chainName} />
      </ConnectedAccountChainLogoContainer>
      <Text data-cy="wallet-address" color="grey-400" weight={500}>
        {props.ensName ?? shortenAddress(props.address, "...", 4)}
      </Text>
    </ConnectedAccountContainer>
  );
};

export default Wallet;
