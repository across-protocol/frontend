import React, { useEffect } from "react";
import { ethers } from "ethers";
import { useSelect } from "downshift";

import { useSend, useBalances, useConnection } from "state/hooks";
import { parseUnits, formatUnits, ParsingError, TOKENS_LIST } from "utils";
import { Section, SectionTitle } from "../Section";
import {
  RoundBox,
  Wrapper,
  Menu,
  Item,
  InputGroup,
  ToggleButton,
  Logo,
  ToggleIcon,
  MaxButton,
  ErrorBox,
  Input,
} from "./CoinSelection.styles";

const CoinSelection = () => {
  const [inputAmount, setInputAmount] = React.useState<string>("");
  const { account, isConnected } = useConnection();
  const { setAmount, setToken, fromChain, amount } = useSend();
  const [error, setError] = React.useState<Error>();
  const tokenList = TOKENS_LIST[fromChain];
  const { data: balances } = useBalances(
    {
      account: account!,
      chainId: fromChain,
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
    defaultSelectedItem: tokenList[0],
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setToken({ token: selectedItem.address });
      }
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputAmount(value);
    if (value === "") {
      setAmount({ amount: ethers.constants.Zero });
      setError(undefined);
      return;
    }
    try {
      const amount = parseUnits(value, selectedItem!.decimals);
      setAmount({ amount });
      if (error instanceof ParsingError) {
        setError(undefined);
      }
    } catch (e) {
      setError(new ParsingError());
    }
  };

  useEffect(() => {
    if (balances && amount && inputAmount !== "") {
      const selectedIndex = tokenList.findIndex(
        ({ address }) => address === selectedItem!.address
      );
      const balance = balances[selectedIndex];
      if (amount.lt(balance)) {
        // clear the previous error if it is not a parsing error
        setError((oldError) => {
          if (oldError instanceof ParsingError) {
            return oldError;
          }
          return undefined;
        });
      } else {
        setError(new Error("Insufficient balance."));
      }
    }
  }, [balances, amount, selectedItem, tokenList, inputAmount]);

  const handleMaxClick = () => {
    if (balances && selectedItem) {
      const selectedIndex = tokenList.findIndex(
        ({ address }) => address === selectedItem.address
      );
      const balance = balances[selectedIndex];
      setAmount({ amount: balance });
      setInputAmount(formatUnits(balance, selectedItem.decimals));
    }
  };

  return (
    <Section>
      <Wrapper>
        <SectionTitle>Asset</SectionTitle>
        <InputGroup>
          <RoundBox as="label" {...getLabelProps()}>
            <ToggleButton
              type="button"
              {...getToggleButtonProps()}
              disabled={!isConnected}
            >
              <Logo src={selectedItem?.logoURI} alt={selectedItem?.name} />
              <div>{selectedItem?.symbol}</div>
              <ToggleIcon />
            </ToggleButton>
          </RoundBox>
          <Menu {...getMenuProps()}>
            {isOpen &&
              tokenList.map((token, index) => (
                <Item
                  {...getItemProps({ item: token, index })}
                  key={token.address}
                >
                  <Logo src={token.logoURI} alt={token.name} />
                  <div>{token.name}</div>
                  <div>
                    {balances &&
                      formatUnits(balances[index], selectedItem!.decimals)}
                  </div>
                </Item>
              ))}
          </Menu>

          <RoundBox
            as="label"
            htmlFor="amount"
            style={{
              // @ts-expect-error TS does not likes custom CSS vars
              "--color": error
                ? "var(--color-error-light)"
                : "var(--color-white)",
            }}
          >
            <MaxButton onClick={handleMaxClick} disabled={!isConnected}>
              max
            </MaxButton>
            <Input
              placeholder="0.00"
              id="amount"
              value={inputAmount}
              onChange={handleChange}
              disabled={!isConnected}
            />
          </RoundBox>
        </InputGroup>
        {error && <ErrorBox>{error.message}</ErrorBox>}
      </Wrapper>
    </Section>
  );
};

export default CoinSelection;
