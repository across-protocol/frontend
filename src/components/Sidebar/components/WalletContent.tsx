import { useCallback } from "react";
import { Connector, useAccount, useConnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import styled from "@emotion/styled";

import { useSidebarContext } from "hooks/useSidebarContext";
import { SidebarItem } from "./SidebarItem";
import { Text } from "components/Text";

import metaMaskIcon from "assets/wallet-logos/metamask.svg";
import coinbaseIcon from "assets/wallet-logos/coinbase.svg";
import walletConnectIcon from "assets/wallet-logos/wallet-connect.svg";
import safeIcon from "assets/wallet-logos/safe.svg";
import injectedIcon from "assets/wallet-logos/injected.svg";
import {
  trackIfWalletSelected,
  trackWalletConnectTransactionCompleted,
} from "utils";
import { WalletAdapter } from "@solana/wallet-adapter-base";

const connectorNameToIcon = {
  MetaMask: metaMaskIcon,
  "Coinbase Wallet": coinbaseIcon,
  WalletConnect: walletConnectIcon,
  Safe: safeIcon,
  Injected: injectedIcon,
};

export function WalletContent() {
  const { connected: isSolanaConnected } = useWallet();
  const { isConnected: isEvmConnected } = useAccount();
  return (
    <>
      <SidebarItem.Header title={"Connect Wallet"} />
      {!isEvmConnected && <EVMWalletContent />}
      {!isSolanaConnected && <SVMWalletContent />}
    </>
  );
}

function EVMWalletContent() {
  const { connectors, isPending, connectAsync } = useConnect();
  const { closeSidebar } = useSidebarContext();

  const handleClickEvmConnector = useCallback(
    async (connector: Connector) => {
      await connectAsync(
        { connector },
        {
          onSuccess: (data) => {
            trackWalletConnectTransactionCompleted(
              data.accounts[0],
              connector.name,
              false
            );
            trackIfWalletSelected(connector.name);
            closeSidebar();
          },
        }
      );
    },
    [closeSidebar, connectAsync]
  );

  return (
    <>
      <WalletTypeSeparator>
        <Text color="light-300" size="sm">
          EVM
        </Text>
      </WalletTypeSeparator>
      {connectors.map((connector) => (
        <WalletItem
          key={connector.id}
          label={connector.name}
          iconUrl={connector.icon || ""}
          onClick={() => handleClickEvmConnector(connector)}
          isPending={isPending}
        />
      ))}
    </>
  );
}

function SVMWalletContent() {
  const { wallets, select, connecting, disconnect, connected } = useWallet();
  const { closeSidebar } = useSidebarContext();

  const handleClickSvmWallet = useCallback(
    async (walletAdapter: WalletAdapter) => {
      try {
        if (connected) {
          await disconnect();
        }
        select(walletAdapter.name);
        walletAdapter.once("connect", () => {
          closeSidebar();
        });
      } catch (e) {
        console.error("Error connecting to Solana wallet", e);
      }
    },
    [select, connected, disconnect, closeSidebar]
  );

  return (
    <>
      <WalletTypeSeparator>
        <Text color="light-300" size="sm">
          SVM
        </Text>
      </WalletTypeSeparator>
      {wallets.map((wallet) => (
        <WalletItem
          key={wallet.adapter.name}
          label={wallet.adapter.name}
          iconUrl={wallet.adapter.icon}
          onClick={() => handleClickSvmWallet(wallet.adapter)}
          isPending={connecting}
        />
      ))}
    </>
  );
}

function WalletItem({
  label,
  iconUrl,
  onClick,
  isPending,
}: {
  label: string;
  iconUrl: string;
  onClick: () => void;
  isPending: boolean;
}) {
  return (
    <SidebarItem.MenuItem
      dataCy={label}
      onClick={onClick}
      label={label}
      disabled={isPending}
      leftIcon={<WalletItemIcon name={label} iconUrl={iconUrl} />}
    />
  );
}

function WalletItemIcon({ name, iconUrl }: { name: string; iconUrl: string }) {
  const icon =
    iconUrl || connectorNameToIcon[name as keyof typeof connectorNameToIcon];
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
