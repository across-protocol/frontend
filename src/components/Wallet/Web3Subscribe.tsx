import { useCallback, useEffect, useState } from "react";
import { SubscribeButton } from "./Wallet.styles";
import { useConnection } from "hooks";
import { isDefined } from "utils";

const Web3Subscribe = () => {
  const { wallet } = useConnection();
  const [isCBWallet, setIsCBWallet] = useState(false);
  const [isSubscribed, setISubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isW3SubscribeAvailable = isDefined((window as any)?.CBWSubscribe);

  const handleSubscribe = useCallback(() => {
    if (isCBWallet) {
      (window as any)?.CBWSubscribe?.toggleSubscription();
    }
  }, [isCBWallet]);

  // Check if CBWallet is available
  useEffect(() => {
    const cbExtensionEnabled =
      (window as any)?.coinbaseWalletExtension?.connectionType ===
      "extension_connection_type";

    const cbWalletSelected = wallet?.label === "Coinbase Wallet";
    setIsCBWallet(cbExtensionEnabled && cbWalletSelected);
  }, [wallet]);

  useEffect(() => {
    (window as any)?.CBWSubscribe?.createSubscriptionUI({
      partnerAddress: "0x7765007Ef1b9B75378F481613D842Fd7613e26f2",
      partnerName: "Across Protocol",
      modalTitle: "Subscribe to Across",
      modalBody: "Subscribe to Across to receive updates and notifications.",
      onSubscriptionChange: setISubscribed,
      onLoading: setIsLoading,
    });
  }, []);

  const subscribeButtonText = isLoading
    ? "Loading..."
    : isSubscribed
      ? "Unsubscribe"
      : "Subscribe";

  return isW3SubscribeAvailable && isCBWallet ? (
    <SubscribeButton onClick={handleSubscribe}>
      {subscribeButtonText}
    </SubscribeButton>
  ) : (
    <></>
  );
};

export default Web3Subscribe;
