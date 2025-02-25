import { useCallback } from "react";
import { Connector, useConnect } from "wagmi";
import styled from "@emotion/styled";

import { useSidebarContext } from "hooks/useSidebarContext";
import { SidebarItem } from "./SidebarItem";
import { Text } from "components/Text";

import metaMaskIcon from "assets/wallet-logos/metamask.svg";
import coinbaseIcon from "assets/wallet-logos/coinbase.svg";
import walletConnectIcon from "assets/wallet-logos/wallet-connect.svg";
import safeIcon from "assets/wallet-logos/safe.svg";
import injectedIcon from "assets/wallet-logos/injected.svg";
import { trackIfWalletSelected } from "utils";
const connectorNameToIcon = {
  MetaMask: metaMaskIcon,
  "Coinbase Wallet": coinbaseIcon,
  WalletConnect: walletConnectIcon,
  Safe: safeIcon,
  Injected: injectedIcon,
};

export function WalletContent() {
  const { connectors, isPending } = useConnect();

  return (
    <>
      <SidebarItem.Header
        title={isPending ? "Connecting..." : "Connect Wallet"}
      />
      <WalletTypeSeparator>
        <Text color="light-300" size="sm">
          EVM
        </Text>
      </WalletTypeSeparator>
      {connectors.map((connector) => (
        <WalletItem key={connector.id} connector={connector} />
      ))}
    </>
  );
}

function WalletItem({ connector }: { connector: Connector }) {
  const { closeSidebar } = useSidebarContext();
  const { isPending, connectAsync } = useConnect();

  const handleClickEvmConnector = useCallback(
    async (connector: Connector) => {
      await connectAsync(
        { connector },
        {
          onSuccess: () => {
            trackIfWalletSelected(connector.name);
            closeSidebar();
          },
        }
      );
    },
    [closeSidebar, connectAsync]
  );

  return (
    <SidebarItem.MenuItem
      key={connector.id}
      dataCy={connector.name}
      onClick={() => handleClickEvmConnector(connector)}
      label={connector.name}
      disabled={isPending}
      leftIcon={<WalletItemIcon connector={connector} />}
    />
  );
}

function WalletItemIcon({ connector }: { connector: Connector }) {
  const { icon: connectorIcon, name } = connector;
  const icon =
    connectorIcon ||
    connectorNameToIcon[name as keyof typeof connectorNameToIcon];
  return icon ? (
    <WalletIcon src={icon} alt={name} />
  ) : (
    <WalletIconPlaceholder />
  );
}

const WalletTypeSeparator = styled.div`
  display: flex;
  padding: 8px 24px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
  background-color: #2b2b2f;
`;

const WalletIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

const WalletIconPlaceholder = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #2b2b2f;
`;
