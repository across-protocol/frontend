import { useMemo } from "react";
import { useDetectBrowserWallets } from "./useDetectBrowserWallets";
import { useLatestWallets } from "./useLatestSvmWallet";
import { Wallet, useWallet } from "@solana/wallet-adapter-react";

export type WalletWithInstalled = Wallet & {
  installed: boolean;
};

export function useWalletsSorted() {
  const wallet = useWallet();
  const installedWallets = useDetectBrowserWallets();
  const { svm: latestWalletName } = useLatestWallets();

  const sortedWallets: WalletWithInstalled[] = useMemo(() => {
    return wallet.wallets
      .map((wallet) => ({
        ...wallet,
        installed: installedWallets.includes(wallet.adapter.name.toLowerCase()),
      }))
      .sort((a, b) => {
        // latest first
        if (
          a.adapter.name.toLowerCase() === latestWalletName &&
          b.adapter.name.toLowerCase() !== latestWalletName
        )
          return -1;
        if (
          b.adapter.name.toLowerCase() === latestWalletName &&
          a.adapter.name.toLowerCase() !== latestWalletName
        )
          return 1;

        // then installed
        if (a.installed && !b.installed) return -1;
        if (b.installed && !a.installed) return 1;

        // fallback
        return a.adapter.name.localeCompare(b.adapter.name);
      });
  }, [installedWallets, latestWalletName, wallet.wallets]);

  return { sortedWallets, ...wallet };
}
