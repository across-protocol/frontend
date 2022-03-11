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
import { CHAINS_SELECTION } from "utils";

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
  } = useChainSelection();

  return (
    <Section>
      <Wrapper>
        <SectionTitle>From</SectionTitle>
        <InputGroup>
          <RoundBox as="label" {...getLabelProps()}>
            <ToggleButton type="button" {...getToggleButtonProps()}>
              <Logo src={selectedItem?.logoURI} alt={selectedItem?.name} />
              <ToggleChainName>{selectedItem?.name}</ToggleChainName>
              <ToggleIcon />
            </ToggleButton>
          </RoundBox>
          <Menu isOpen={isOpen} {...getMenuProps()}>
            {isOpen &&
              CHAINS_SELECTION.map((t, index) => {
                return (
                  <Item
                    className={t.chainId === fromChain ? "disabled" : ""}
                    {...getItemProps({ item: t, index })}
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    key={t.chainId}
                  >
                    <Logo src={t.logoURI} alt={t.name} />
                    <div>{t.name}</div>
                    <span className="layer-type">
                      {index !== CHAINS_SELECTION.length - 1 ? "L2" : "L1"}
                    </span>
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
