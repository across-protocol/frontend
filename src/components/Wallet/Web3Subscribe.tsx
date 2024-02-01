import { useCallback, useEffect, useMemo, useState } from "react";
import { SubscribeButton } from "./Wallet.styles";
import { useConnection } from "hooks";

const Web3Subscribe = () => {
  const { wallet } = useConnection();
  const [isCBWallet, setIsCBWallet] = useState(false);
  const [isSubscribed, setISubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const subscribeButtonText = useMemo(() => {
    if (isLoading) return "Loading...";
    return isSubscribed ? "Unsubscribe" : "Subscribe";
  }, [isLoading, isSubscribed]);

  const handleSubscribe = useCallback(() => {
    if (isCBWallet) {
      (window as any).CBWSubscribe.toggleSubscription();
    }
  }, [isCBWallet]);

  // Check if CBWallet is available
  useEffect(() => {
    setIsCBWallet(wallet?.label === "Coinbase Wallet");
  }, [wallet]);

  useEffect(() => {
    (window as any).CBWSubscribe.createSubscriptionUI({
      partnerAddress: "0x7765007Ef1b9B75378F481613D842Fd7613e26f2",
      partnerName: "Across Protocol",
      modalTitle: "Subscribe to Across",
      modalBody: "Subscribe to Across to receive updates and notifications.",
      onSubscriptionChange: setISubscribed,
      onLoading: setIsLoading,
    });
  }, []);

  return isCBWallet ? (
    <SubscribeButton onClick={handleSubscribe}>
      {subscribeButtonText}
    </SubscribeButton>
  ) : (
    <></>
  );
};

export default Web3Subscribe;
