import { FC, Dispatch, SetStateAction } from "react";

import { useSelect } from "downshift";

import { useBalances, useConnection } from "state/hooks";
import { formatUnits, TOKENS_LIST, ChainId, Token } from "utils";
import { SectionTitle } from "../Section";

import {
  RoundBox,
  Wrapper,
  Menu,
  Item,
  InputGroup,
  ToggleButton,
  Logo,
  ToggleIcon,
} from "./PoolSelection.styles";

interface Props {
  token: Token;
  setToken: Dispatch<SetStateAction<Token>>;
  wrongNetwork?: boolean;
}

const PoolSelection: FC<Props> = ({ token, setToken }) => {
  const { account } = useConnection();

  const { data: balances } = useBalances(
    {
      account: account!,
      chainId: ChainId.MAINNET,
    },
    { skip: !account }
  );

  const {
    isOpen,
    selectedItem,
    getLabelProps,
    getToggleButtonProps,
    getItemProps,
    getMenuProps,
  } = useSelect({
    items: TOKENS_LIST[ChainId.MAINNET],
    defaultSelectedItem: token,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setToken(selectedItem);
      }
    },
  });

  return (
    <Wrapper>
      <SectionTitle>Select pool</SectionTitle>
      <InputGroup>
        <RoundBox as="label" {...getLabelProps()}>
          <ToggleButton type="button" {...getToggleButtonProps()}>
            <Logo src={selectedItem?.logoURI} alt={selectedItem?.name} />
            <div>{selectedItem?.symbol}</div>
            <ToggleIcon />
          </ToggleButton>
        </RoundBox>
        <Menu {...getMenuProps()}>
          {isOpen &&
            TOKENS_LIST[ChainId.MAINNET].map((t, index) => {
              return (
                <Item {...getItemProps({ item: t, index })} key={t.address}>
                  <Logo src={t.logoURI} alt={t.name} />
                  <div>{t.name}</div>
                  <div>
                    {balances && formatUnits(balances[index], t.decimals)}
                  </div>
                </Item>
              );
            })}
        </Menu>
      </InputGroup>
    </Wrapper>
  );
};

export default PoolSelection;
