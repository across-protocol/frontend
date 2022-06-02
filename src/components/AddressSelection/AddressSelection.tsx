import React from "react";
import { XOctagon } from "react-feather";
import { shortenAddress } from "utils";
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
  WarningBox,
} from "./AddressSelection.styles";
import { AnimatePresence } from "framer-motion";
import useAddressSelection from "./useAddressSelection";

const AddressSelection: React.FC = () => {
  const {
    getItemProps,
    getLabelProps,
    getMenuProps,
    getToggleButtonProps,
    isOpen,
    toAddress,
    isValid,
    isConnected,
    toggle,
    handleAddressChange,
    handleSubmit,
    clearInput,
    open,
    address,
    availableToChains,
    selectedToChainInfo,
    fromChain,
    showContractAddressWarning,
  } = useAddressSelection();

  return (
    <AnimatePresence>
      <LastSection>
        <Wrapper>
          <SectionTitle>To</SectionTitle>
          <InputGroup>
            <RoundBox
              as="label"
              {...getLabelProps()}
              disabled={fromChain === undefined}
            >
              <ToggleButton
                type="button"
                {...getToggleButtonProps()}
                disabled={fromChain === undefined}
              >
                {selectedToChainInfo && (
                  <Logo
                    src={selectedToChainInfo?.logoURI}
                    alt={selectedToChainInfo?.name}
                  />
                )}
                <div>
                  <ToggleChainName>
                    {selectedToChainInfo
                      ? selectedToChainInfo.name
                      : "Select Chain"}
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
                availableToChains.map(
                  ({ logoURI, name, chainId, disabled }, index) => {
                    return (
                      <Item
                        className={disabled ? "disabled" : ""}
                        {...getItemProps({ item: chainId, index })}
                        key={chainId}
                      >
                        <Logo src={logoURI} alt={name} />
                        <div>{name}</div>
                      </Item>
                    );
                  }
                )}
            </Menu>
          </InputGroup>
          {selectedToChainInfo && (
            <ChangeWrapper onClick={toggle}>
              <ChangeButton className={!isConnected ? "disabled" : ""}>
                Change account
              </ChangeButton>
            </ChangeWrapper>
          )}
        </Wrapper>
        {selectedToChainInfo && (
          <Dialog isOpen={open} onClose={toggle}>
            <h3>Send To</h3>
            <div>Address on {selectedToChainInfo.name}</div>
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
              <SecondaryButton onClick={handleSubmit} disabled={!isValid}>
                Save Changes
              </SecondaryButton>
            </ButtonGroup>
            {showContractAddressWarning && (
              <WarningBox>
                {`
              Warning --- Address you inputted is a contract address. When sending ETH from L2 -> L1 WETH will arrive. Ensure the contract address will properly handle WETH or this may result in loss of funds.
            `}
              </WarningBox>
            )}
          </Dialog>
        )}
      </LastSection>
    </AnimatePresence>
  );
};

export default AddressSelection;
