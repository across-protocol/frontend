import { useState, useEffect } from "react";

type EIP6963ProviderDetail = {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: unknown; // not sure the exact type here
};

/**
 * Custom event type for announcing a wallet provider.
 */
type EIP6963AnnounceProviderEvent = CustomEvent & {
  type: "eip6963:announceProvider";
  detail: EIP6963ProviderDetail;
};

export function useDetectBrowserWallets(): string[] {
  const [walletNames, setWalletNames] = useState<string[]>([]);

  const handleAnnounce = (event: EIP6963AnnounceProviderEvent) => {
    console.log(event);
    const providerDetail = event.detail;
    const walletName = providerDetail?.info?.name?.toLowerCase();
    console.log(`Detected: ${walletName}`);
    if (walletName) {
      setWalletNames((prevNames) => {
        // Avoid duplicates based on wallet name
        if (prevNames.includes(walletName)) {
          return prevNames;
        }
        return [...prevNames, walletName];
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
