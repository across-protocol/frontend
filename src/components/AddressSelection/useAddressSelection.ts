import { useSelect } from "downshift";
import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { useSendForm } from "hooks";
import { CHAINS_SELECTION, isValidAddress } from "utils";

export default function useAddressSelection() {
  const { isConnected, account } = useConnection();
  const { toChain, toAddress, fromChain, setToChain, setToAddress } =
    useSendForm();
  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);

  const downshiftState = useSelect({
    items: CHAINS_SELECTION,
    defaultSelectedItem: toChain,
    selectedItem: toChain,
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
    if (isValid) {
      if (address) {
        setToAddress(address);
      } else if (account) {
        setToAddress(account);
      }
      toggle();
    }
  };

  return {
    ...downshiftState,
    handleSubmit,
    handleAddressChange,
    clearInput,
    isValid,
    toAddress,
    toChain,
    fromChain,
    toggle,
    open,
    address,
    isConnected,
  };
}
