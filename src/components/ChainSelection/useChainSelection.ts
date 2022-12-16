import { ampli } from "../../ampli";
import { useSelect } from "downshift";
import { useConnection } from "hooks";
import { useSendForm } from "hooks";
import { useEffect, useState } from "react";
import {
  UnsupportedChainIdError,
  switchChain,
  getChainInfo,
  trackEvent,
  ChainId,
} from "utils";

export default function useChainSelection() {
  const { isConnected, provider, chainId, error, connect } = useConnection();
  const { fromChain, setFromChain, availableFromChains } = useSendForm();
  const [previousFromChain, setPreviousFromChain] = useState<
    ChainId | undefined
  >(undefined);

  useEffect(() => {
    if (fromChain && fromChain !== previousFromChain) {
      const chainInfo = getChainInfo(fromChain);
      ampli.fromChainSelected({
        fromChainId: chainInfo.chainId.toString(),
        chainName: chainInfo.name,
      });
      setPreviousFromChain(fromChain);
    }
  }, [fromChain, previousFromChain]);

  const wrongNetworkSend =
    fromChain &&
    provider &&
    chainId &&
    (error instanceof UnsupportedChainIdError || chainId !== fromChain);

  const buttonText = wrongNetworkSend
    ? `Switch to ${getChainInfo(fromChain).name}`
    : !isConnected
    ? "Connect Wallet"
    : null;

  const handleClick = () => {
    if (!provider) {
      connect({ trackSection: "bridgeForm" });
    } else if (wrongNetworkSend) {
      switchChain(provider, fromChain);
    }
  };

  const downshiftState = useSelect({
    items: availableFromChains.map((chain) => chain.chainId),
    selectedItem: fromChain,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        // Matomo track fromChain
        trackEvent({
          category: "send",
          action: "setFromChain",
          name: selectedItem.toString(),
        });
        setFromChain(selectedItem);
      }
    },
  });
  return {
    ...downshiftState,
    buttonText,
    handleClick,
    isConnected,
    wrongNetworkSend,
    fromChain,
    availableFromChains,
  };
}
