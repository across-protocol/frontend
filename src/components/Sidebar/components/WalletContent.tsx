import { useCallback, useEffect } from "react";
import { Connector, useAccount } from "wagmi";
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
import { useConnectSorted } from "hooks/useConnectSorted";
import { useWalletsSorted } from "hooks/useWalletSorted";

const connectorNameToIcon = {
  MetaMask: metaMaskIcon,
  "Coinbase Wallet": coinbaseIcon,
  WalletConnect: walletConnectIcon,
  Safe: safeIcon,
  Injected: injectedIcon,
};

export function WalletContent() {
  return (
    <>
      <SidebarItem.Header title={"Connect Wallet"} />
      <EVMWalletContent />
      <SVMWalletContent />
    </>
  );
}

function EVMWalletContent() {
  const { sortedConnectors, isPending, connect } = useConnectSorted();
  const { closeSidebar } = useSidebarContext();
  const { isConnected: isEvmConnected } = useAccount();

  const handleClickEvmConnector = useCallback(
    (connector: Connector) => {
      connect(
        { connector },
        {
          onSuccess: (data) => {
            console.log("onSuccess", data);
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
    [closeSidebar, connect]
  );

  if (isEvmConnected) {
    return null;
  }

  return (
    <>
      <WalletTypeSeparator>
        <Text color="light-300" size="sm">
          EVM
        </Text>
      </WalletTypeSeparator>
      {sortedConnectors.map((connector) => (
        <WalletItem
          key={connector.id}
          label={connector.name}
          iconUrl={connector.icon || ""}
          onClick={() => handleClickEvmConnector(connector)}
          isPending={isPending}
          secondaryLabel={connector?.installed ? "Installed" : undefined}
        />
      ))}
    </>
  );
}

function SVMWalletContent() {
  const { sortedWallets, select, connecting, disconnect, connected } =
    useWalletsSorted();
  const { closeSidebar } = useSidebarContext();
  const { connected: isSolanaConnected } = useWallet();

  useEffect(() => {
    if (!connecting && isSolanaConnected) {
      closeSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connecting, isSolanaConnected]);

  const handleClickSvmWallet = useCallback(
    async (walletAdapter: WalletAdapter) => {
      try {
        if (connected) {
          await disconnect();
        }
        select(walletAdapter.name);
      } catch (e) {
        console.error("Error connecting to Solana wallet", e);
      }
    },
    [select, connected, disconnect]
  );

  if (isSolanaConnected) {
    return null;
  }

  return (
    <>
      <WalletTypeSeparator>
        <Text color="light-300" size="sm">
          SVM
        </Text>
      </WalletTypeSeparator>
      {sortedWallets.map((wallet) => (
        <WalletItem
          key={wallet.key}
          label={wallet.adapter.name}
          iconUrl={wallet.adapter.icon}
          onClick={() => handleClickSvmWallet(wallet.adapter)}
          isPending={connecting}
          secondaryLabel={wallet.installed ? "Installed" : undefined}
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
  secondaryLabel,
}: {
  label: string;
  iconUrl: string;
  onClick: () => void;
  isPending: boolean;
  secondaryLabel?: string;
}) {
  return (
    <SidebarItem.MenuItem
      dataCy={label}
      onClick={onClick}
      label={label}
      disabled={isPending}
      secondaryLabel={secondaryLabel}
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
