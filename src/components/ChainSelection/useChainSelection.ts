import { useSelect } from "downshift";
import { useConnection } from "state/hooks";
import { useSendForm } from "hooks";
import {
  UnsupportedChainIdError,
  CHAINS,
  CHAINS_SELECTION,
  switchChain,
  onboard,
  DEFAULT_FROM_CHAIN_ID,
} from "utils";

export default function useChainSelection() {
  const { init } = onboard;
  const { isConnected, provider, chainId, error } = useConnection();
  const { fromChain, setFromChain } = useSendForm();

  const wrongNetworkSend =
    provider &&
    chainId &&
    (error instanceof UnsupportedChainIdError || chainId !== fromChain);

  const buttonText = wrongNetworkSend
    ? `Switch to ${CHAINS[fromChain].name}`
    : !isConnected
      ? "Connect Wallet"
      : null;

  const handleClick = () => {
    if (!provider) {
      init();
    } else if (wrongNetworkSend) {
      switchChain(provider, fromChain);
    }
  };

  const downshiftState = useSelect({
    items: CHAINS_SELECTION,
    defaultSelectedItem: DEFAULT_FROM_CHAIN_ID,
    selectedItem: fromChain,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
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
  };
}
