import React from "react";
import { onboard } from "utils";
import { useConnection } from "state/hooks";
import { CHAINS, switchChain, ChainId, UnsupportedChainIdError } from "utils";
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
import { useSelect } from "downshift";
import { CHAINS_SELECTION } from "utils/constants";
import { actions } from "state/send";
import { useAppDispatch, useAppSelector } from "state/hooks";

// Remove eth from this list.
const filteredChains = CHAINS_SELECTION.slice(0, CHAINS_SELECTION.length - 1);

const ChainSelection: React.FC = () => {
  const { init } = onboard;
  const { isConnected, provider, chainId, error } = useConnection();
  const sendState = useAppSelector((state) => state.send);

  const dispatch = useAppDispatch();

  const wrongNetworkSend =
    provider &&
    chainId &&
    (error instanceof UnsupportedChainIdError ||
      chainId !== sendState.currentlySelectedFromChain.chainId);

  const buttonText = wrongNetworkSend
    ? `Switch to ${CHAINS[sendState.currentlySelectedFromChain.chainId].name}`
    : !isConnected
    ? "Connect Wallet"
    : null;

  const handleClick = () => {
    if (!provider) {
      init();
    } else if (wrongNetworkSend) {
      switchChain(provider, sendState.currentlySelectedFromChain.chainId);
    }
  };

  const {
    isOpen,
    selectedItem,
    getLabelProps,
    getToggleButtonProps,
    getItemProps,
    getMenuProps,
  } = useSelect({
    items: filteredChains,
    defaultSelectedItem: sendState.currentlySelectedFromChain,
    selectedItem: sendState.currentlySelectedFromChain,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        const nextState = { ...sendState, fromChain: selectedItem.chainId };
        dispatch(actions.fromChain(nextState));
        dispatch(actions.updateSelectedFromChain(selectedItem));
        const nsToChain = { ...sendState, toChain: ChainId.MAINNET };
        if (selectedItem.chainId === ChainId.MAINNET) {
          nsToChain.toChain = ChainId.OPTIMISM;
          dispatch(actions.toChain(nsToChain));
          dispatch(actions.updateSelectedToChain(CHAINS_SELECTION[0]));
        }
        if (
          selectedItem.chainId !== ChainId.MAINNET &&
          sendState.currentlySelectedToChain.chainId !== ChainId.MAINNET
        ) {
          dispatch(
            actions.updateSelectedToChain(
              CHAINS_SELECTION[CHAINS_SELECTION.length - 1]
            )
          );
        }
      }
    },
  });

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
              filteredChains.map((t, index) => {
                return (
                  <Item
                    className={
                      t === sendState.currentlySelectedFromChain
                        ? "disabled"
                        : ""
                    }
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
