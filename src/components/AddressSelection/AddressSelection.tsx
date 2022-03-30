import React from "react";
import { XOctagon } from "react-feather";
import {
  CHAINS,
  shortenAddress,
  isL2,
  getReacheableChains,
  CHAINS_SELECTION,
  DEFAULT_TO_CHAIN_ID,
} from "utils";
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
  LayerType,
} from "./AddressSelection.styles";
import { AnimatePresence } from "framer-motion";
import useAddressSelection from "./useAddressSelection";

const AddressSelection: React.FC = () => {
  const {
    getItemProps,
    getLabelProps,
    getMenuProps,
    getToggleButtonProps,
    selectedItem,
    isOpen,
    toChain,
    fromChain,
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

  const selectedChain = CHAINS[selectedItem ?? DEFAULT_TO_CHAIN_ID];
  const reacheableChains = getReacheableChains(fromChain);
  return (
    <AnimatePresence>
      <LastSection>
        <Wrapper>
          <SectionTitle>To</SectionTitle>
          <InputGroup>
            <RoundBox as="label" {...getLabelProps()}>
              <ToggleButton type="button" {...getToggleButtonProps()}>
                <Logo src={selectedChain.logoURI} alt={selectedChain.name} />
                <div>
                  <ToggleChainName>{selectedChain.name}</ToggleChainName>
                  {toAddress && (
                    <Address>{shortenAddress(toAddress, "...", 4)}</Address>
                  )}
                </div>
                <ToggleIcon />
              </ToggleButton>
            </RoundBox>
            <Menu isOpen={isOpen} {...getMenuProps()}>
              {isOpen &&
                CHAINS_SELECTION.map((t, index) => {
                  return (
                    <Item
                      className={
                        t === toChain ||
                        t === fromChain ||
                        !reacheableChains.includes(t)
                          ? "disabled"
                          : ""
                      }
                      {...getItemProps({ item: t, index })}
                      key={t}
                    >
                      <Logo src={CHAINS[t].logoURI} alt={CHAINS[t].name} />
                      <div>{CHAINS[t].name}</div>
                      <LayerType>{isL2(t) ? "L2" : "L1"}</LayerType>
                    </Item>
                  );
                })}
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
