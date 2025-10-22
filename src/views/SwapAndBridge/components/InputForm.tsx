import { COLORS, formatUSD } from "utils";
import SelectorButton from "./ChainTokenSelector/SelectorButton";
import { EnrichedToken } from "./ChainTokenSelector/Modal";
import { BalanceSelector } from "./BalanceSelector";
import { QuoteWarning } from "./QuoteWarning";
import styled from "@emotion/styled";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BigNumber } from "ethers";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { ReactComponent as ArrowDown } from "assets/icons/arrow-down.svg";
import { AmountInputError } from "views/Bridge/utils";
import { useTokenInput, UnitType } from "hooks";
import { formatUnits } from "ethers/lib/utils";
import ChangeAccountModal from "views/Bridge/components/ChangeAccountModal";

export const InputForm = ({
  inputToken,
  outputToken,
  setInputToken,
  setOutputToken,
  setAmount,
  isAmountOrigin,
  setIsAmountOrigin,
  isQuoteLoading,
  expectedOutputAmount,
  expectedInputAmount,
  validationError,
  quoteWarningMessage,
  toAccountEVM,
  toAccountSVM,
  handleChangeToAddressEVM,
  handleChangeToAddressSVM,
  destinationChainEcosystem,
}: {
  inputToken: EnrichedToken | null;
  setInputToken: (token: EnrichedToken | null) => void;

  outputToken: EnrichedToken | null;
  setOutputToken: (token: EnrichedToken | null) => void;

  isQuoteLoading: boolean;
  expectedOutputAmount: string | undefined;
  expectedInputAmount: string | undefined;

  setAmount: (amount: BigNumber | null) => void;

  isAmountOrigin: boolean;
  setIsAmountOrigin: (isAmountOrigin: boolean) => void;
  validationError: AmountInputError | undefined;
  quoteWarningMessage: string | null;

  toAccountEVM?: { address: string };
  toAccountSVM?: { address: string };
  handleChangeToAddressEVM: (account: string) => void;
  handleChangeToAddressSVM: (account: string) => void;
  destinationChainEcosystem: "evm" | "svm";
}) => {
  // Shared unit state for both inputs
  const [unit, setUnit] = useState<UnitType>("token");

  const quickSwap = useCallback(() => {
    const origin = inputToken;
    const destination = outputToken;

    setOutputToken(origin);
    setInputToken(destination);

    setAmount(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputToken, outputToken]);

  return (
    <Wrapper>
      <TokenInput
        setToken={setInputToken}
        token={inputToken}
        setAmount={(amount) => {
          setAmount(amount);
          setIsAmountOrigin(true);
        }}
        isOrigin={true}
        expectedAmount={expectedInputAmount}
        shouldUpdate={!isAmountOrigin}
        isUpdateLoading={isQuoteLoading}
        insufficientInputBalance={
          validationError === AmountInputError.INSUFFICIENT_BALANCE
        }
        otherToken={outputToken}
        disabled={!outputToken || !outputToken}
        unit={unit}
        setUnit={setUnit}
        toAccountEVM={toAccountEVM}
        toAccountSVM={toAccountSVM}
        handleChangeToAddressEVM={handleChangeToAddressEVM}
        handleChangeToAddressSVM={handleChangeToAddressSVM}
        destinationChainEcosystem={destinationChainEcosystem}
      />
      <QuickSwapButton onClick={quickSwap}>
        <ArrowDown width="20px" height="20px" />
      </QuickSwapButton>
      <TokenInput
        setToken={setOutputToken}
        token={outputToken}
        setAmount={(amount) => {
          setAmount(amount);
          setIsAmountOrigin(false);
        }}
        isOrigin={false}
        expectedAmount={expectedOutputAmount}
        shouldUpdate={isAmountOrigin}
        isUpdateLoading={isQuoteLoading}
        otherToken={inputToken}
        disabled={!outputToken || !outputToken}
        unit={unit}
        setUnit={setUnit}
        toAccountEVM={toAccountEVM}
        toAccountSVM={toAccountSVM}
        handleChangeToAddressEVM={handleChangeToAddressEVM}
        handleChangeToAddressSVM={handleChangeToAddressSVM}
        destinationChainEcosystem={destinationChainEcosystem}
      />
      {/* <QuoteWarning message={quoteWarningMessage} /> */}
    </Wrapper>
  );
};

const TokenInput = ({
  setToken,
  token,
  setAmount,
  isOrigin,
  expectedAmount,
  shouldUpdate,
  isUpdateLoading,
  insufficientInputBalance = false,
  otherToken,
  disabled,
  unit,
  setUnit,
  toAccountEVM,
  toAccountSVM,
  handleChangeToAddressEVM,
  handleChangeToAddressSVM,
  destinationChainEcosystem,
}: {
  setToken: (token: EnrichedToken) => void;
  token: EnrichedToken | null;
  setAmount: (amount: BigNumber | null) => void;
  isOrigin: boolean;
  expectedAmount: string | undefined;
  shouldUpdate: boolean;
  isUpdateLoading: boolean;
  insufficientInputBalance?: boolean;
  disabled?: boolean;
  otherToken?: EnrichedToken | null;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
  toAccountEVM?: { address: string };
  toAccountSVM?: { address: string };
  handleChangeToAddressEVM: (account: string) => void;
  handleChangeToAddressSVM: (account: string) => void;
  destinationChainEcosystem: "evm" | "svm";
}) => {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocusedRef = useRef(false);

  const {
    amountString,
    convertedAmount,
    toggleUnit,
    handleInputChange,
    handleBalanceClick,
  } = useTokenInput({
    token,
    setAmount,
    expectedAmount,
    shouldUpdate,
    isUpdateLoading,
    unit,
    setUnit,
  });

  const inputDisabled = (() => {
    if (disabled) return true;
    return Boolean(shouldUpdate && isUpdateLoading);
  })();

  useEffect(() => {
    // Focus origin token amount input when it first becomes enabled
    if (
      isOrigin &&
      !inputDisabled &&
      !hasAutoFocusedRef.current &&
      amountInputRef.current
    ) {
      amountInputRef.current.focus();
      hasAutoFocusedRef.current = true;
    }
  }, [isOrigin, inputDisabled]);

  const formattedConvertedAmount = (() => {
    if (!convertedAmount) return "0.00";
    if (unit === "token") {
      // convertTokenToUSD returns in 18 decimal precision
      return "$" + formatUSD(convertedAmount);
    }
    // convertUSDToToken returns in token's native decimals
    return `${formatUnits(convertedAmount, token?.decimals)} ${token?.symbol}`;
  })();

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>
          {isOrigin ? "From" : "To"}
          {!isOrigin && (
            <>
              <ChangeAccountModal
                currentAccountEVM={toAccountEVM?.address}
                currentAccountSVM={toAccountSVM?.address}
                onChangeAccountEVM={handleChangeToAddressEVM}
                onChangeAccountSVM={handleChangeToAddressSVM}
                destinationChainEcosystem={destinationChainEcosystem}
              />
            </>
          )}
        </TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={amountString}
          error={insufficientInputBalance}
        >
          <TokenAmountInput
            id={`${isOrigin ? "origin" : "destination"}-token-input`}
            name={`${isOrigin ? "origin" : "destination"}-token-input`}
            ref={amountInputRef}
            placeholder="0.00"
            value={amountString}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={inputDisabled}
            error={insufficientInputBalance}
          />
        </TokenAmountInputWrapper>
        <TokenAmountInputEstimatedUsd>
          <ValueRow>
            <UnitToggleButton onClick={toggleUnit}>
              <ArrowsCross width={16} height={16} />{" "}
              <span>Value: {formattedConvertedAmount}</span>
            </UnitToggleButton>
          </ValueRow>
        </TokenAmountInputEstimatedUsd>
      </TokenAmountStack>
      <TokenSelectorColumn>
        <SelectorButton
          onSelect={setToken}
          isOriginToken={isOrigin}
          marginBottom={token ? "24px" : "0px"}
          selectedToken={token}
          otherToken={otherToken}
        />

        {token && (
          <BalanceSelector
            balance={token.balance}
            disableHover={!isOrigin}
            decimals={token.decimals}
            error={insufficientInputBalance}
            setAmount={(amount) => {
              if (amount) {
                handleBalanceClick(amount, token.decimals);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};

const TokenSelectorColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
`;

const ValueRow = styled.div`
  font-size: 16px;
  span {
    margin-left: 4px;
  }
  span,
  svg {
    display: inline-block;
    vertical-align: middle;
  }
`;

const UnitToggleButton = styled.button`
  color: var(--color-neutrals-light-200);

  &:hover:not(:disabled) {
    color: var(--color-interface-white);
  }

  svg {
    color: inherit;
  }
`;

const TokenAmountStack = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;

  height: 100%;
`;

const TokenAmountInputTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.aqua};
  font-size: 16px;
  font-weight: 500;
  line-height: 130%;
`;

const ChangeRecipientButton = styled.button`
  color: ${COLORS["light-200"]};
  font-size: 14px;
  font-weight: 400;
  text-decoration: underline;
  opacity: 0.7;
  margin-left: 8px;

  &:hover {
    opacity: 1;
    color: ${COLORS.aqua};
  }
`;

const TokenAmountInputWrapper = styled.div<{
  showPrefix: boolean;
  value: string;
  error: boolean;
}>`
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;

  font-size: 48px;
  font-weight: 300;
  line-height: 120%;
  letter-spacing: -1.92px;

  color: ${({ value, error }) =>
    error ? COLORS.error : value ? COLORS.aqua : COLORS["light-200"]};

  &:focus-within {
    font-size: 48px;
  }

  ${({ showPrefix }) =>
    showPrefix &&
    `
    &::before {
      content: "$";
      margin-right: 4px;
      flex-shrink: 0;
      font-size: 48px;
      font-weight: 300;
      line-height: 120%;
      letter-spacing: -1.92px;
    }
  `}
`;

const TokenAmountInput = styled.input<{
  value: string;
  error: boolean;
}>`
  width: 100%;
  outline: none;
  border: none;
  background: transparent;
  font: inherit;
  font-size: inherit;
  color: ${({ value, error }) =>
    error ? COLORS.error : value ? COLORS.aqua : COLORS["light-200"]};
  flex-shrink: 0;

  &:focus {
    font-size: 48px;
    outline: none;
  }
`;

const TokenAmountInputEstimatedUsd = styled.div`
  color: ${COLORS["light-200"]};
  font-family: Barlow;
  font-size: 14px;
  font-weight: 400;
  line-height: 130%;
  opacity: 0.5;
`;

const TokenInputWrapper = styled.div`
  display: flex;
  min-height: 148px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  background: transparent;
  position: relative;
  padding: 24px;
  border-radius: 24px;
  background: ${COLORS["black-700"]};
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
`;

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  align-self: stretch;
`;

const QuickSwapButton = styled.button`
  display: flex;
  width: 46px;
  height: 38px;
  position: absolute;
  left: calc(50% - 20px);
  top: calc(50% - 16px);
  justify-content: center;
  align-items: center;
  background: ${COLORS["black-700"]};
  border: 3px solid ${COLORS["black-800"]};
  border-radius: 15px;
  z-index: 4;
  cursor: pointer;

  & * {
    flex-shrink: 0;
  }

  &:hover {
    svg {
      color: white;
    }
  }
`;
