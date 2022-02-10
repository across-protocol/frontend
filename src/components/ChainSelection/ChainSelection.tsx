import React, { useEffect } from "react";
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
import usePrevious from "hooks/usePrevious";

const ChainSelection: React.FC = () => {
  const { init } = onboard;
  const { isConnected, provider, chainId, error } = useConnection();
  const sendState = useAppSelector((state) => state.send);
  const dispatch = useAppDispatch();

  /*
    The following block will attempt to change the dropdown when the user connects the app.

    Otherwise, it just makes sure to map the dropdown value when the currentSelected block changes.

    This will also change the dropdown value in <AddressSelection /> because of the hook in there.
  */
  const previousChainId = usePrevious(chainId);
  useEffect(() => {
    if (chainId && previousChainId === undefined) {
      const findChain = CHAINS_SELECTION.find((x) => x.chainId === chainId);
      const notFindChain = CHAINS_SELECTION.filter(
        (x) => x.chainId !== chainId
      );

      if (findChain && notFindChain) {
        dispatch(actions.updateSelectedFromChain(findChain));
        dispatch(
          actions.updateSelectedToChain(notFindChain[notFindChain.length - 1])
        );
        dispatch(
          actions.fromChain({ ...sendState, fromChain: findChain.chainId })
        );
        dispatch(
          actions.toChain({
            ...sendState,
            toChain: notFindChain[notFindChain.length - 1].chainId,
          })
        );
      }
    }
  }, [
    chainId,
    previousChainId,
    sendState.currentlySelectedFromChain,
    dispatch,
    sendState,
  ]);

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
    items: CHAINS_SELECTION,
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
              CHAINS_SELECTION.map((t, index) => {
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
