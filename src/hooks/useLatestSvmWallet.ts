import { useLocalStorage, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";
import { useConnections } from "wagmi";

const makeKey = (type: string) => `last-connected-wallet-${type.toLowerCase()}`;

export function useLatestWallets(): {
  evm: string | undefined;
  svm: string | undefined;
} {
  const { wallet } = useWallet();
  const connections = useConnections();

  const [latestSvmWallet, setLatestSvmWallet] = useLocalStorage<
    string | undefined
  >(makeKey("svm"), undefined);

  const [latestEvmWallet, setLatestEvmWallet] = useLocalStorage<
    string | undefined
  >(makeKey("evm"), undefined);

  useEffect(() => {
    const currentSvm = wallet?.adapter?.name?.toLowerCase();
    if (currentSvm && currentSvm !== latestSvmWallet) {
      setLatestSvmWallet(currentSvm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.adapter?.name]);

  useEffect(() => {
    const currentEvm =
      connections.length > 0
        ? connections[0].connector.name.toLowerCase()
        : undefined;
    if (currentEvm && currentEvm !== latestEvmWallet) {
      setLatestEvmWallet(currentEvm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections]);

  const value = useMemo(
    () => ({
      svm: latestSvmWallet,
      evm: latestEvmWallet,
    }),
    [latestEvmWallet, latestSvmWallet]
  );

  return value;
}
