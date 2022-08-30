import { formatUnits } from "utils";
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
  Input,
  ErrorBox,
  BalanceLabel,
} from "./CoinSelection.styles";
import useCoinSelection from "./useCoinSelection";
import { AnimatePresence } from "framer-motion";

const CoinSelection = () => {
  const {
    isConnected,
    isOpen,
    getLabelProps,
    getToggleButtonProps,
    getItemProps,
    getMenuProps,
    selectedItem,
    handleMaxClick,
    availableTokens,
    inputAmount,
    handleInputChange,
    errorMsg,
    error,
    showError,
    balances,
    balance,
    fromChain,
    provider,
    account,
  } = useCoinSelection();
  if (provider && account) {
    provider.getBalance(account).then((res) => {
      console.log(res.toString());
    });
  }
  return (
    <AnimatePresence>
      <Section>
        <Wrapper>
          <SectionTitle>Asset</SectionTitle>
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
                {selectedItem && (
                  <Logo src={selectedItem.logoURI} alt={selectedItem.name} />
                )}
                <div>{selectedItem ? selectedItem.symbol : "Select Chain"}</div>
                <ToggleIcon />
              </ToggleButton>
            </RoundBox>
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
                onChange={handleInputChange}
                data-cy="amount-input"
              />
            </RoundBox>
            <Menu {...getMenuProps()} isOpen={isOpen}>
              {isOpen &&
                availableTokens.map((token, index) => (
                  <Item
                    {...getItemProps({ item: token, index })}
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -10 }}
                    key={token.symbol}
                  >
                    <Logo src={token.logoURI} alt={token.name} />
                    <div>{token.name}</div>
                    <div>
                      {balances &&
                        formatUnits(balances[index] || "0", token.decimals)}
                    </div>
                  </Item>
                ))}
            </Menu>
          </InputGroup>
          <BalanceLabel data-cy="balance">
            {balance &&
              selectedItem &&
              `Balance ${formatUnits(balance, selectedItem.decimals)} ${
                selectedItem.symbol
              }`}
          </BalanceLabel>
          <ErrorBox
            animate={{
              opacity: showError ? 1 : 0,
              display: showError ? "block" : "none",
            }}
          >
            {showError && errorMsg}
          </ErrorBox>
        </Wrapper>
      </Section>
    </AnimatePresence>
  );
};

export default CoinSelection;
