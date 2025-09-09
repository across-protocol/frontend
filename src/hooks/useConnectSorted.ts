import { useMemo } from "react";
import { Connector, useConnect } from "wagmi";
import { useDetectBrowserWallets } from "./useDetectBrowserWallets";
import { useLatestWallets } from "./useLatestSvmWallet";

export type ConnectorWithInstalled = Connector & {
  installed: boolean;
};

export function useConnectSorted() {
  const connect = useConnect();
  const installedWallets = useDetectBrowserWallets();
  const { evm: latestWalletName } = useLatestWallets();

  const sortedConnectors: ConnectorWithInstalled[] = useMemo(() => {
    return connect.connectors
      .map((connector) => ({
        ...connector,
        installed: installedWallets.includes(connector.name.toLowerCase()),
      }))
      .sort((a, b) => {
        // latest first
        if (
          a.name.toLowerCase() === latestWalletName &&
          b.name.toLowerCase() !== latestWalletName
        )
          return -1;
        if (
          b.name.toLowerCase() === latestWalletName &&
          a.name.toLowerCase() !== latestWalletName
        )
          return 1;

        // then installed
        if (a.installed && !b.installed) return -1;
        if (b.installed && !a.installed) return 1;

        // fallback
        return a.name.localeCompare(b.name);
      });
  }, [connect.connectors, installedWallets, latestWalletName]);

  return { sortedConnectors, ...connect };
}
