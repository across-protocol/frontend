import { shortenAddress, isSupportedChainId, getChainInfo } from "utils";

import solanaLogo from "assets/wallet-logos/solana.svg";
import Web3Subscribe from "./Web3Subscribe";
import { Text } from "components/Text";

import { useReverseNameResolver } from "hooks/useReverseNameResolver";
import { useSidebarContext } from "hooks/useSidebarContext";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";

import {
  ConnectButton,
  BalanceButton,
  Separator,
  WalletWrapper,
  ConnectedAccountChainLogoContainer,
  ConnectedAccountContainer,
} from "./Wallet.styles";

const Wallet = () => {
  const evmConnection = useConnectionEVM();
  const svmConnection = useConnectionSVM();

  const { ensName, hlName } = useReverseNameResolver(evmConnection.account);
  const { openSidebar } = useSidebarContext();

  const evmChainInfo = isSupportedChainId(evmConnection.chainId)
    ? getChainInfo(evmConnection.chainId)
    : {
        name: "Unsupported Network",
        logoURI: "",
      };

  if (!evmConnection.isConnected && svmConnection.state !== "connected") {
    return (
      <ConnectButton
        data-cy="wallet-connect-button"
        onClick={() => {
          evmConnection.connect({ trackSection: "navbar" });
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
        {evmConnection.account && (
          <ConnectedAccount
            chainLogoUrl={evmChainInfo.logoURI}
            chainName={evmChainInfo.name}
            address={evmConnection.account}
            ensName={ensName}
            hlName={hlName}
          />
        )}
        {evmConnection.isConnected && svmConnection.isConnected && (
          <Separator />
        )}
        {svmConnection.account && (
          <ConnectedAccount
            chainLogoUrl={solanaLogo}
            chainName="Solana"
            address={svmConnection.account.toBase58()}
          />
        )}
      </BalanceButton>
    </WalletWrapper>
  );
};

export const ConnectedAccount = (props: {
  chainLogoUrl: string;
  chainName: string;
  address: string;
  ensName?: string | null;
  hlName?: string | null;
}) => {
  const displayName = formatDisplayName(
    props.address,
    props.ensName,
    props.hlName
  );

  return (
    <ConnectedAccountContainer>
      <ConnectedAccountChainLogoContainer>
        <img src={props.chainLogoUrl} alt={props.chainName} />
      </ConnectedAccountChainLogoContainer>
      <Text data-cy="wallet-address" color="grey-400" weight={500}>
        {displayName}
      </Text>
    </ConnectedAccountContainer>
  );
};

function formatDisplayName(
  address: string,
  ensName: string | null | undefined,
  hlName: string | null | undefined
): string {
  if (ensName && hlName) {
    return `${ensName} / ${hlName}`;
  }
  if (ensName) {
    return ensName;
  }
  if (hlName) {
    return hlName;
  }
  return shortenAddress(address, "...", 4);
}

export default Wallet;
