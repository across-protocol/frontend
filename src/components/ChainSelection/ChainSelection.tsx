import React from "react";
import { Section, SectionTitle } from "../Section";
import {
  Wrapper,
  RoundBox,
  Logo,
  ConnectButton,
  Menu,
  Item,
  ToggleIcon,
  ToggleButton,
  InputGroup,
  ToggleChainName,
} from "./ChainSelection.styles";
import useChainSelection from "./useChainSelection";
import { getChainInfo } from "utils";

const ChainSelection: React.FC = () => {
  const {
    selectedItem,
    getLabelProps,
    getToggleButtonProps,
    isOpen,
    getMenuProps,
    getItemProps,
    isConnected,
    wrongNetworkSend,
    handleClick,
    buttonText,
    fromChain,
    availableChains,
  } = useChainSelection();

  const selectedChain = selectedItem ? getChainInfo(selectedItem) : undefined;

  return (
    <Section>
      <Wrapper>
        <SectionTitle>From</SectionTitle>
        <InputGroup>
          <RoundBox as="label" {...getLabelProps()}>
            <ToggleButton type="button" {...getToggleButtonProps()}>
              {selectedChain && (
                <>
                  <Logo src={selectedChain.logoURI} alt={selectedChain.name} />
                  <ToggleChainName>{selectedChain.name}</ToggleChainName>
                  <ToggleIcon />
                </>
              )}
            </ToggleButton>
          </RoundBox>
          <Menu isOpen={isOpen} {...getMenuProps()}>
            {isOpen &&
              availableChains.map(({ chainId, name, logoURI }, index) => {
                return (
                  <Item
                    className={chainId === fromChain ? "disabled" : ""}
                    {...getItemProps({ item: chainId, index })}
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    key={chainId}
                  >
                    <Logo src={logoURI} alt={name} />
                    <div>{name}</div>
                  </Item>
                );
              })}
          </Menu>
        </InputGroup>
        {(wrongNetworkSend || !isConnected) && (
          <ConnectButton onClick={handleClick}>{buttonText}</ConnectButton>
        )}
      </Wrapper>
    </Section>
  );
};
export default ChainSelection;
