import React, { useEffect } from "react";
import { ethers, BigNumber } from "ethers";
import { useSelect } from "downshift";
import { max } from "utils";

import {
  useSend,
  useBalances,
  useConnection,
  useBridgeFees,
  useL2Block,
} from "state/hooks";
import { parseUnits, formatUnits, ParsingError, TOKENS_LIST } from "utils";
import { Section, SectionTitle } from "../Section";
import { useAppSelector } from "state/hooks";

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
  Input,
  ErrorBox,
} from "./CoinSelection.styles";
import { AnimatePresence } from "framer-motion";

const FEE_ESTIMATION = ".004";
const CoinSelection = () => {
  const { account, isConnected } = useConnection();
  const { setAmount, setToken, amount, token } = useSend();

  const [error, setError] = React.useState<Error>();
  const sendState = useAppSelector((state) => state.send);

  const tokenList = TOKENS_LIST[sendState.currentlySelectedFromChain.chainId];
  const { data: balances } = useBalances(
    {
      account: account!,
      chainId: sendState.currentlySelectedFromChain.chainId,
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
    defaultSelectedItem: tokenList.find((t) => t.address === token),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setInputAmount("");
        // since we are resetting input to 0, reset any errors
        setError(undefined);
        setAmount({ amount: BigNumber.from("0") });
        setToken({ token: selectedItem.address });
      }
    },
  });
  const [inputAmount, setInputAmount] = React.useState<string>(
    selectedItem && amount.gt("0")
      ? formatUnits(amount, selectedItem.decimals)
      : ""
  );

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
      // just throw an error if lt 0 and let the catch set the parsing error
      if (amount.lt(0)) throw new Error();
      setAmount({ amount });
      if (error instanceof ParsingError) {
        setError(undefined);
      }
    } catch (e) {
      setError(new ParsingError());
    }
  };

  // checks for insufficient balance errors
  useEffect(() => {
    if (amount && inputAmount) {
      // clear the previous error if it is not a parsing error
      setError((oldError) => {
        if (oldError instanceof ParsingError) {
          return oldError;
        }
        return undefined;
      });

      if (balances && amount.gt(0)) {
        const selectedIndex = tokenList.findIndex(
          ({ address }) => address === token
        );
        if (balances[selectedIndex]) {
          const balance = balances[selectedIndex] || ethers.BigNumber.from("0");
          const isEth = tokenList[selectedIndex].symbol === "ETH";
          if (
            amount.gt(
              isEth
                ? balance.sub(ethers.utils.parseEther(FEE_ESTIMATION))
                : balance
            )
          ) {
            setError(new Error("Insufficient balance."));
          }
        }
      }
    }
  }, [balances, amount, token, tokenList, inputAmount]);

  const handleMaxClick = () => {
    if (balances && selectedItem) {
      const selectedIndex = tokenList.findIndex(
        ({ address }) => address === selectedItem.address
      );
      if (balances[selectedIndex]) {
        const isEth = tokenList[selectedIndex].symbol === "ETH";
        const balance = isEth
          ? max(
              balances[selectedIndex].sub(
                ethers.utils.parseEther(FEE_ESTIMATION)
              ),
              0
            )
          : balances[selectedIndex];
        setAmount({ amount: balance });
        setInputAmount(formatUnits(balance, selectedItem.decimals));
      } else {
        setAmount({ amount: ethers.BigNumber.from("0") });
        setInputAmount(
          formatUnits(ethers.BigNumber.from("0"), selectedItem.decimals)
        );
      }
    }
  };

  const { block } = useL2Block();

  const { data: fees } = useBridgeFees(
    {
      amount,
      tokenSymbol: selectedItem!.symbol,
      blockTime: block?.timestamp!,
    },
    { skip: amount.lte(0) || !block?.timestamp || !selectedItem?.symbol }
  );

  const errorMsg = error
    ? error.message
    : fees?.isAmountTooLow
    ? "Bridge fee is high for this amount. Send a larger amount."
    : fees?.isLiquidityInsufficient
    ? `Insufficient liquidity for ${selectedItem?.symbol}.`
    : undefined;

  const showError =
    error ||
    (fees?.isAmountTooLow && amount.gt(0)) ||
    (fees?.isLiquidityInsufficient && amount.gt(0));

  return (
    <AnimatePresence>
      <Section>
        <Wrapper>
          <SectionTitle>Asset</SectionTitle>
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
                tokenList.map((token, index) => (
                  <Item
                    {...getItemProps({ item: token, index })}
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    key={token.address}
                  >
                    <Logo src={token.logoURI} alt={token.name} />
                    <div>{token.name}</div>
                    <div>
                      {balances &&
                        formatUnits(balances[index], tokenList[index].decimals)}
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
                "--outline-color": error
                  ? "var(--color-error)"
                  : "var(--color-primary)",
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
              />
            </RoundBox>
          </InputGroup>
          {showError && <ErrorBox>{errorMsg}</ErrorBox>}
        </Wrapper>
      </Section>
    </AnimatePresence>
  );
};

export default CoinSelection;
