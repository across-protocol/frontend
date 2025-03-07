import { useState, useEffect } from "react";

// Based on https://eips.ethereum.org/EIPS/eip-6963
type EIP6963ProviderDetail = {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: unknown; // not sure the exact type here
};

type EIP6963AnnounceProviderEvent = CustomEvent & {
  type: "eip6963:announceProvider";
  detail: EIP6963ProviderDetail;
};

export function useDetectBrowserWallets(): string[] {
  const [walletNames, setWalletNames] = useState<string[]>([]);

  const handleAnnounce = (event: EIP6963AnnounceProviderEvent) => {
    const providerDetail = event.detail;
    const walletName = providerDetail?.info?.name?.toLowerCase();

    if (walletName) {
      setWalletNames((prevNames) => {
        return Array.from(new Set(prevNames).add(walletName));
      });
    }
  };

  useEffect(() => {
    // Listen for announcements
    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnounce as unknown as EventListener
    );

    // ask wallets to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Cleanup
    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnounce as unknown as EventListener
      );
    };
  }, []);

  return walletNames;
}
