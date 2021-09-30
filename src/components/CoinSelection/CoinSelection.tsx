import React, { useState, useMemo } from "react";
import styled from "@emotion/styled";
import { useSelect } from "downshift";
import { ChevronDown } from "react-feather";
import { SecondaryButton } from "../BaseButton";
import { COIN_LIST, formatUnits } from "../../utils";
import { useBalances } from "../../state/chain";
import { useConnection, useGlobal } from "../../state/hooks";

const CoinSelection: React.FC = () => {
  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const { chainId } = useConnection();
  const { currentAccount, currentChainId } = useGlobal();

  const coinList = COIN_LIST[currentChainId];
  const { data: balances } = useBalances(
    {
      account: currentAccount,
      // @ts-expect-error this wont ever be undefined as the query wont run if its undefined (see skip below)
      chainId,
      tokens: coinList.map((coin) => coin.address),
    },
    { skip: currentAccount == null || chainId == null }
  );

  const {
    isOpen,
    getLabelProps,
    getToggleButtonProps,
    getItemProps,
    getMenuProps,
    selectedItem,
  } = useSelect({ items: coinList, defaultSelectedItem: coinList[0] });

  const selectedIndex = useMemo(
    () => coinList.findIndex((c) => c.address === selectedItem!.address),
    [selectedItem, coinList]
  );

  const balance = useMemo(
    () => balances && balances[selectedIndex],
    [balances, selectedIndex]
  );

  const handleMaxClick = () => {
    if (balance && selectedItem) {
      const parsedBalance = parseFloat(
        formatUnits(balance, selectedItem.decimals)
      );

      setCoinAmount(parsedBalance);
    } else {
      setCoinAmount(0);
    }
  };

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(evt.target.value, 10);
    const parsedBalance =
      balance && selectedItem
        ? parseFloat(formatUnits(balance, selectedItem.decimals))
        : Infinity;
    if (value > parsedBalance && !error) {
      setError("Insufficient balance.");
    }
    if (value < parsedBalance && error) {
      setError("");
    }
    setCoinAmount(value);
  };

  return (
    <Wrapper>
      <Heading>Amount</Heading>
      <Controls>
        <Label
          {...getLabelProps()}
          style={{
            "--setColor": "var(--white)",
          }}
        >
          <SelectCoinButton type="button" {...getToggleButtonProps()}>
            <div>
              <Logo src={selectedItem?.logoURI} alt={selectedItem?.name} />
            </div>
            <div>{selectedItem?.symbol}</div>
            <ChevronDown />
          </SelectCoinButton>
        </Label>
        <Menu {...getMenuProps()}>
          {isOpen &&
            coinList.map((item, index) => (
              <Item {...getItemProps({ item, index })} key={item.symbol}>
                <div>
                  <Logo src={item.logoURI} alt={item.name} />
                </div>
                <div>{item.name}</div>
                <div>
                  {balances
                    ? formatUnits(balances[index], coinList[index].decimals)
                    : "0.00"}
                </div>
              </Item>
            ))}
        </Menu>
        <Label
          htmlFor="amount"
          style={{
            // @ts-expect-error
            "--setColor": error ? "var(--error-light)" : "var(--white)",
          }}
        >
          <MaxButton onClick={handleMaxClick}>max</MaxButton>
          <Input
            type="number"
            placeholder="0.00"
            id="amount"
            value={coinAmount}
            onChange={handleChange}
          />
        </Label>
      </Controls>
      {balance && (
        <BalanceMsg
          style={{
            // @ts-expect-error
            "--setColor": error ? "var(--error)" : "var(--primary)",
          }}
        >
          Balance: {formatUnits(balance, coinList[selectedIndex].decimals)}{" "}
          {selectedItem?.symbol}
        </BalanceMsg>
      )}
      {error && <ErrorWrapper>{error}</ErrorWrapper>}
    </Wrapper>
  );
};

export default CoinSelection;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Heading = styled.h3`
  font-size: ${20 / 16}rem;
  font-weight: bold;
  margin-bottom: 16px;
`;

const Controls = styled.div`
  --radius: 50px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
`;

const Label = styled.label`
  background-color: var(--setColor);
  border-radius: var(--radius);
  padding: 10px;
  display: flex;
`;
const Input = styled.input`
  border: none;
  font-size: ${16 / 16}rem;
  text-align: right;
  padding: 0;
  background-color: inherit;
`;
const MaxButton = styled(SecondaryButton)`
  border-radius: var(--radius);
  padding: 10px 20px;
  text-transform: uppercase;
`;

const SelectCoinButton = styled.button`
  background-color: inherit;
  border: none;
  display: block;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius);
  text-transform: uppercase;
  font-size: ${16 / 16}rem;
  font-weight: bold;
  padding: 0;
`;

const Menu = styled.ul`
  color: var(--gray);

  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transform: translateY(105%);
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
`;

const Item = styled.li<{ isSelected: boolean }>`
  padding: 15px 10px 10px;
  display: flex;
  gap: 10px;
  cursor: pointer;
  background-color: var(--white);
  transition: background-color 100ms linear;

  &:first-of-type {
    border-radius: calc(var(--radius) / 4) calc(var(--radius) / 4) 0 0;
  }

  &:last-of-type {
    border-radius: 0 0 calc(var(--radius) / 4) calc(var(--radius) / 4);
  }

  &:hover {
    background-color: var(--gray-lightest);
  }

  & > div:last-of-type {
    margin-left: auto;
  }
`;

const Logo = styled.img`
  display: block;
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: 999px;
`;

const BalanceMsg = styled.div`
  color: var(--setColor);
  align-self: flex-end;
  padding-right: 25px;
`;

const ErrorWrapper = styled.div`
  border-radius: 50px;
  width: 100%;
  background-color: var(--error);
  color: var(--gray);
  padding: 10px 10px;
  margin: 16px 0;
`;
