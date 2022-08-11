import { FC, Dispatch, SetStateAction } from "react";
import { AnimatePresence } from "framer-motion";
import { useSelect } from "downshift";

import { useBalances, useConnection } from "state/hooks";
import { formatUnits, TokenList, ChainId, Token } from "utils";
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
  tokenList: TokenList;
  setToken: Dispatch<SetStateAction<Token>>;
  wrongNetwork?: boolean;
  chainId: ChainId;
}

const PoolSelection: FC<Props> = ({ token, setToken, tokenList, chainId }) => {
  const { account } = useConnection();

  const { data: balances } = useBalances(
    {
      account: account!,
      chainId,
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
    items: tokenList,
    defaultSelectedItem: token,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setToken(selectedItem as any);
      }
    },
  });

  return (
    <AnimatePresence>
      <Wrapper>
        <SectionTitle>Select pool</SectionTitle>
        <InputGroup data-cy="select-pool">
          <RoundBox as="label" {...getLabelProps()}>
            <ToggleButton type="button" {...getToggleButtonProps()}>
              <Logo src={selectedItem?.logoURI} alt={selectedItem?.name} />
              <div>{selectedItem?.symbol}</div>
              <ToggleIcon />
            </ToggleButton>
          </RoundBox>
          <Menu {...getMenuProps()} isOpen={isOpen}>
            {isOpen &&
              tokenList.map((t, index) => {
                return (
                  <Item
                    {...getItemProps({ item: t, index })}
                    key={t.name}
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    data-cy={`pool-${t.symbol.toLowerCase()}`}
                  >
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
    </AnimatePresence>
  );
};

export default PoolSelection;
