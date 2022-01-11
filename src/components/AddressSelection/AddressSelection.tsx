import React, { useState, useEffect } from "react";
import { XOctagon } from "react-feather";
import { useConnection, useSend } from "state/hooks";
import { CHAINS, shortenAddress, isValidAddress, ChainId } from "utils";
import { SectionTitle } from "../Section";
import Dialog from "../Dialog";
import { SecondaryButton } from "../Buttons";
import {
  LastSection,
  Wrapper,
  Logo,
  ChangeWrapper,
  ChangeButton,
  InputWrapper,
  Input,
  ClearButton,
  CancelButton,
  ButtonGroup,
  InputError,
  Menu,
  Item,
  ToggleIcon,
  ToggleButton,
  InputGroup,
  RoundBox,
  ToggleChainName,
  Address,
  ItemWarning,
} from "./AddressSelection.styles";
import { useSelect } from "downshift";
import { CHAINS_SELECTION } from "utils/constants";
import { useAppDispatch, useAppSelector } from "state/hooks";
import { actions } from "state/send";
import { AnimatePresence } from "framer-motion";

const AddressSelection: React.FC = () => {
  const { isConnected } = useConnection();
  const { toChain, toAddress, fromChain, setToAddress } = useSend();
  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();

  const sendState = useAppSelector((state) => state.send);

  const {
    isOpen,
    selectedItem,
    getLabelProps,
    getToggleButtonProps,
    getItemProps,
    getMenuProps,
  } = useSelect({
    items: CHAINS_SELECTION,
    defaultSelectedItem: sendState.currentlySelectedToChain,
    selectedItem: sendState.currentlySelectedToChain,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        const nextState = { ...sendState, toChain: selectedItem.chainId };
        dispatch(actions.toChain(nextState));
        dispatch(actions.updateSelectedToChain(selectedItem));
        const nsToChain = { ...sendState };
        if (selectedItem.chainId === ChainId.MAINNET) {
          nsToChain.fromChain = ChainId.OPTIMISM;
          dispatch(actions.fromChain(nsToChain));
          dispatch(actions.updateSelectedFromChain(CHAINS_SELECTION[0]));
        }
      }
    },
  });

  useEffect(() => {
    if (toAddress) {
      setAddress(toAddress);
    }
  }, [toAddress]);

  const toggle = () => {
    // modal is closing, reset address to the current toAddress
    if (!isConnected) return;
    if (open) setAddress(toAddress || address);
    setOpen((oldOpen) => !oldOpen);
  };
  const clearInput = () => {
    setAddress("");
  };

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(evt.target.value);
  };
  const isValid = !address || isValidAddress(address);
  const handleSubmit = () => {
    if (isValid && address) {
      setToAddress({ toAddress: address });
      toggle();
    }
  };

  const isL1toL2 = fromChain === ChainId.MAINNET;

  return (
    <AnimatePresence>
      <LastSection>
        <Wrapper>
          <SectionTitle>To</SectionTitle>
          <InputGroup>
            <RoundBox as="label" {...getLabelProps()}>
              <ToggleButton type="button" {...getToggleButtonProps()}>
                <Logo src={selectedItem?.logoURI} alt={selectedItem?.name} />
                <div>
                  <ToggleChainName>
                    {selectedItem?.name === "Ether"
                      ? "Mainnet"
                      : selectedItem?.name}
                  </ToggleChainName>
                  {toAddress && <Address>{shortenAddress(toAddress)}</Address>}
                </div>
                <ToggleIcon />
              </ToggleButton>
            </RoundBox>
            <Menu isOpen={isOpen} {...getMenuProps()}>
              {isOpen &&
                sendState.currentlySelectedToChain.chainId !==
                  ChainId.MAINNET &&
                CHAINS_SELECTION.map((t, index) => {
                  return (
                    <Item
                      className={
                        t === sendState.currentlySelectedToChain ||
                        t.chainId === ChainId.MAINNET
                          ? "disabled"
                          : ""
                      }
                      {...getItemProps({ item: t, index })}
                      key={t.chainId}
                    >
                      <Logo src={t.logoURI} alt={t.name} />
                      <div>{t.name}</div>
                      <span className="layer-type">
                        {t.chainId !== ChainId.MAINNET ? "L2" : "L1"}
                      </span>
                    </Item>
                  );
                })}
              {isOpen &&
                sendState.currentlySelectedToChain.chainId ===
                  ChainId.MAINNET && (
                  <>
                    <ItemWarning
                      initial={{ y: -10 }}
                      animate={{ y: 0 }}
                      exit={{ y: -10 }}
                    >
                      <p>
                        Transfers between L2 chains is not possible at this time
                      </p>
                    </ItemWarning>
                    {CHAINS_SELECTION.map((t, index) => {
                      return (
                        <Item
                          className={"disabled"}
                          {...getItemProps({ item: t, index })}
                          key={t.chainId}
                          initial={{ y: -10 }}
                          animate={{ y: 0 }}
                          exit={{ y: -10 }}
                        >
                          <Logo src={t.logoURI} alt={t.name} />
                          <div>{t.name}</div>
                          <span className="layer-type">
                            {index !== CHAINS_SELECTION.length - 1
                              ? "L2"
                              : "L1"}
                          </span>
                        </Item>
                      );
                    })}
                  </>
                )}
            </Menu>
          </InputGroup>
          {!isL1toL2 && (
            <ChangeWrapper onClick={toggle}>
              <ChangeButton className={!isConnected ? "disabled" : ""}>
                Change account
              </ChangeButton>
            </ChangeWrapper>
          )}
        </Wrapper>
        <Dialog isOpen={open} onClose={toggle}>
          <h3>Send To</h3>
          <div>Address on {CHAINS[toChain].name}</div>
          <InputWrapper>
            <Input onChange={handleChange} value={address} />
            <ClearButton onClick={clearInput}>
              <XOctagon
                fill="var(--color-gray-300)"
                stroke="var(--color-white)"
              />
            </ClearButton>
            {!isValid && <InputError>Not a valid address</InputError>}
          </InputWrapper>
          <ButtonGroup>
            <CancelButton onClick={toggle}>Cancel</CancelButton>
            <SecondaryButton
              onClick={handleSubmit}
              disabled={!isValid || !address}
            >
              Save Changes
            </SecondaryButton>
          </ButtonGroup>
        </Dialog>
      </LastSection>
    </AnimatePresence>
  );
};

export default AddressSelection;
