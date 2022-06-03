import { useSelect } from "downshift";
import { useState, useEffect } from "react";
import { useConnection } from "state/hooks";
import { useSendForm } from "hooks";
import {
  isValidAddress,
  getChainInfo,
  trackEvent,
  getCode,
  noContractCode,
} from "utils";

export default function useAddressSelection() {
  const { isConnected, account } = useConnection();
  const {
    toChain,
    fromChain,
    setToChain,
    setToAddress,
    availableToChains,
    toAddress,
  } = useSendForm();

  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showContractAddressWarning, setShowContractAddressWarning] =
    useState(false);

  const selectedToChainInfo = toChain ? getChainInfo(toChain) : undefined;

  const downshiftState = useSelect({
    items: availableToChains.map((chain) => chain.chainId),
    selectedItem: toChain,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        // matomo tracking
        trackEvent({
          category: "send",
          action: "setToChain",
          name: selectedItem.toString(),
        });
        setToChain(selectedItem);
      }
    },
  });

  // keep the address in sync with the form address
  useEffect(() => {
    if (toAddress) {
      setAddress(toAddress);
    }

    setShowContractAddressWarning(false);
  }, [toAddress, toChain]);

  // modal is closing, reset address to the current toAddress
  const toggle = () => {
    if (!isConnected) return;
    if (open) setAddress(toAddress || address);
    setOpen((prevOpen) => !prevOpen);
  };
  const clearInput = () => {
    setAddress("");
    setShowContractAddressWarning(false);
    setChecked(false);
  };

  const handleAddressChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(evt.target.value);
    if (showContractAddressWarning) {
      setShowContractAddressWarning(false);
      setChecked(false);
    }
  };
  const isValid = !address || isValidAddress(address);
  const handleSubmit = () => {
    setShowContractAddressWarning(false);

    if (isValid) {
      if (address && toChain) {
        // Check to see if the toAddress they are inputting is a Contract on Mainnet
        // If so, warn user because we send WETH and this could cause loss of funds.
        // Note: Removed check for WETH and ETH because they can change tokens outside of this modal.
        getCode(address, toChain)
          .then((addr) => {
            if (addr !== noContractCode) {
              setShowContractAddressWarning(true);
            } else {
              setToAddress(address);
              toggle();
            }
          })
          .catch((err) => {
            console.log("err in getCode call", err);
          });
      } else if (account) {
        setToAddress(account);
        toggle();
      }
    }
  };

  const overrideAddress = () => {
    setToAddress(address);
    toggle();
    setShowContractAddressWarning(false);
    setChecked(false);
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
    availableToChains,
    selectedToChainInfo,
    showContractAddressWarning,
    overrideAddress,
    checked,
    setChecked,
  };
}
