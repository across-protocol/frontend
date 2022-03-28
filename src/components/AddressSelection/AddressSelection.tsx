import React from "react";
import { XOctagon } from "react-feather";
import { CHAINS, shortenAddress, ChainId } from "utils";
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
import { CHAINS_SELECTION, DEFAULT_TO_CHAIN_ID } from "utils/constants";
import { AnimatePresence } from "framer-motion";
import useAddressSelection from "./useAddressSelection";

const AddressSelection: React.FC = () => {
  const {
    getItemProps,
    getLabelProps,
    getMenuProps,
    getToggleButtonProps,
    selectedItem: maybeSelectedItem,
    isOpen,
    toChain,
    toAddress,
    isL1toL2,
    isValid,
    isConnected,
    toggle,
    handleAddressChange,
    handleSubmit,
    clearInput,
    open,
    address,
  } = useAddressSelection();

  const selectedItem = maybeSelectedItem ?? DEFAULT_TO_CHAIN_ID;
  return (
    <AnimatePresence>
      <LastSection>
        <Wrapper>
          <SectionTitle>To</SectionTitle>
          <InputGroup>
            <RoundBox as="label" {...getLabelProps()}>
              <ToggleButton type="button" {...getToggleButtonProps()}>
                <Logo
                  src={CHAINS[selectedItem].logoURI}
                  alt={CHAINS[selectedItem].name}
                />
                <div>
                  <ToggleChainName>
                    {CHAINS[selectedItem].name === "Ether"
                      ? "Mainnet"
                      : CHAINS[selectedItem].name}
                  </ToggleChainName>
                  {toAddress && (
                    <Address>{shortenAddress(toAddress, "...", 4)}</Address>
                  )}
                </div>
                <ToggleIcon />
              </ToggleButton>
            </RoundBox>
            <Menu isOpen={isOpen} {...getMenuProps()}>
              {isOpen &&
                toChain !== ChainId.MAINNET &&
                CHAINS_SELECTION.map((t, index) => {
                  return (
                    <Item
                      className={
                        t === toChain || t === ChainId.MAINNET ? "disabled" : ""
                      }
                      {...getItemProps({ item: t, index })}
                      key={t}
                    >
                      <Logo src={CHAINS[t].logoURI} alt={CHAINS[t].name} />
                      <div>{CHAINS[t].name}</div>
                      <span className="layer-type">
                        {t !== ChainId.MAINNET ? "L2" : "L1"}
                      </span>
                    </Item>
                  );
                })}
              {isOpen && toChain === ChainId.MAINNET && (
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
                        key={t}
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        exit={{ y: -10 }}
                      >
                        <Logo src={CHAINS[t].logoURI} alt={CHAINS[t].name} />
                        <div>{CHAINS[t].name}</div>
                        <span className="layer-type">
                          {index !== CHAINS_SELECTION.length - 1 ? "L2" : "L1"}
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
            <Input onChange={handleAddressChange} value={address} />
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
