import { COLORS, formatUSD, formatUSDString } from "utils";
import SelectorButton from "./ChainTokenSelector/SelectorButton";
import { EnrichedToken } from "./ChainTokenSelector/Modal";
import BalanceSelector from "./BalanceSelector";
import styled from "@emotion/styled";
import { useCallback } from "react";
import { BigNumber } from "ethers";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { AmountInputError } from "views/Bridge/utils";
import { useTokenInput } from "hooks";
import { formatUnits } from "ethers/lib/utils";

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
}) => {
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
      />
      <QuickSwapButton onClick={quickSwap}>
        <ArrowsCross width="12px" height="12px" />
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
      />
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
}) => {
  const {
    amountString,
    unit,
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
  });

  const inputDisabled = (() => {
    if (disabled) return true;
    return Boolean(shouldUpdate && isUpdateLoading);
  })();

  const formattedConvertedAmount = (() => {
    if (!convertedAmount) return "0.00";
    if (unit === "token") {
      return "$" + formatUSD(convertedAmount, token?.decimals);
    }
    return `${formatUnits(convertedAmount, token?.decimals)} ${token?.symbol}`;
  })();

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>
          {isOrigin ? "From" : "To"}
        </TokenAmountInputTitle>
        <TokenAmountInput
          placeholder="0.00"
          value={amountString}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={inputDisabled}
          error={insufficientInputBalance}
        />
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

const UnitToggleButton = styled.button``;

const TokenAmountStack = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;

  height: 100%;
`;

const TokenAmountInputTitle = styled.div`
  color: ${COLORS.aqua};
  font-size: 16px;
  font-weight: 500;
  line-height: 130%;
`;

const TokenAmountInput = styled.input<{
  value: string;
  error: boolean;
}>`
  font-family: Barlow;
  font-size: 48px;
  font-weight: 300;
  line-height: 120%;
  letter-spacing: -1.92px;
  width: 100%;
  color: ${({ value, error }) =>
    error ? COLORS.error : value ? COLORS.aqua : COLORS["light-200"]};

  outline: none;
  border: none;
  background: transparent;

  flex-shrink: 0;

  &:focus {
    font-size: 48px;
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
  width: 40px;
  height: 32px;
  position: absolute;
  left: calc(50% - 20px);
  top: calc(50% - 16px);
  justify-content: center;
  align-items: center;
  background: ${COLORS["black-700"]};
  border: 3px solid ${COLORS["black-800"]};
  border-radius: 12px;
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
