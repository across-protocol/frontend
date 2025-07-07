import { useMemo } from "react";
import { useLatestWallets } from "./useLatestSvmWallet";
import { Wallet, useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";

export type WalletWithInstalled = Wallet & {
  installed: boolean;
  key: string;
};

export function useWalletsSorted() {
  const wallet = useWallet();

  const { svm: latestWalletName } = useLatestWallets();

  const sortedWallets: WalletWithInstalled[] = useMemo(() => {
    return wallet.wallets
      .map((wallet) => ({
        ...wallet,
        installed: wallet.readyState === WalletReadyState.Installed,
        key: wallet.adapter.name + wallet.adapter.icon, // handle MetaMask x2
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
  }, [latestWalletName, wallet.wallets]);

  return { sortedWallets, ...wallet };
}
