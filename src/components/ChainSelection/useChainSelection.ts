import { useSelect } from "downshift";
import { useConnection } from "state/hooks";
import { useSendForm } from "hooks";
import {
  UnsupportedChainIdError,
  switchChain,
  onboard,
  getConfig,
  getChainInfo,
} from "utils";

export default function useChainSelection() {
  const { init } = onboard;
  const { isConnected, provider, chainId, error } = useConnection();
  const { fromChain, setFromChain } = useSendForm();
  const config = getConfig();

  const availableChains = config.getSpokeChains();
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
      init();
    } else if (wrongNetworkSend) {
      switchChain(provider, fromChain);
    }
  };

  const downshiftState = useSelect({
    items: config.getSpokeChainIds(),
    defaultSelectedItem: fromChain,
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
    availableChains,
  };
}
