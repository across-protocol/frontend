import { useSelect } from "downshift";
import { useConnection } from "hooks";
import { useSendForm } from "hooks";
import {
  UnsupportedChainIdError,
  switchChain,
  getChainInfo,
  trackEvent,
} from "utils";

export default function useChainSelection() {
  const { isConnected, provider, chainId, error, connect } = useConnection();
  const { fromChain, setFromChain, availableFromChains } = useSendForm();

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
      connect();
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
