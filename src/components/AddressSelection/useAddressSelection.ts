import { useSelect } from "downshift";
import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { useSendForm } from "hooks";
import { CHAINS_SELECTION, ChainId, isValidAddress } from "utils";

export default function useAddressSelection() {
  const { isConnected } = useConnection();
  const { toChain, toAddress, fromChain, setToChain, setToAddress } =
    useSendForm();
  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);

  const downshiftState = useSelect({
    items: CHAINS_SELECTION,
    defaultSelectedItem: CHAINS_SELECTION.find((x) => x === toChain),
    selectedItem: CHAINS_SELECTION.find((x) => x === toChain),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setToChain(selectedItem);
      }
    },
  });

  // keep the address in sync with the form address
  useEffect(() => {
    if (toAddress) {
      setAddress(toAddress);
    }
  }, [toAddress]);
  // modal is closing, reset address to the current toAddress
  const toggle = () => {
    if (!isConnected) return;
    if (open) setAddress(toAddress || address);
    setOpen((prevOpen) => !prevOpen);
  };
  const clearInput = () => {
    setAddress("");
  };

  const handleAddressChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(evt.target.value);
  };
  const isValid = !address || isValidAddress(address);
  const handleSubmit = () => {
    if (isValid && address) {
      setToAddress(address);
      toggle();
    }
  };

  const isL1toL2 = fromChain === ChainId.MAINNET;

  return {
    ...downshiftState,
    handleSubmit,
    handleAddressChange,
    clearInput,
    isL1toL2,
    isValid,
    toAddress,
    toChain,
    toggle,
    open,
    address,
    isConnected,
  };
}
