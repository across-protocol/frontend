import { COLORS, formatUnitsWithMaxFractions, formatUSD } from "utils";
import SelectorButton, {
  EnrichedTokenSelect,
} from "./ChainTokenSelector/SelectorButton";
import BalanceSelector from "./BalanceSelector";
import styled from "@emotion/styled";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber, utils } from "ethers";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { AmountInputError } from "views/Bridge/utils";

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
  inputToken: EnrichedTokenSelect | null;
  setInputToken: (token: EnrichedTokenSelect | null) => void;

  outputToken: EnrichedTokenSelect | null;
  setOutputToken: (token: EnrichedTokenSelect | null) => void;

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
      />
      <QuickSwapButtonWrapper>
        <QuickSwapButton onClick={quickSwap}>
          <ArrowsCross />
        </QuickSwapButton>
      </QuickSwapButtonWrapper>
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
}: {
  setToken: (token: EnrichedTokenSelect) => void;
  token: EnrichedTokenSelect | null;
  setAmount: (amount: BigNumber | null) => void;
  isOrigin: boolean;
  expectedAmount: string | undefined;
  shouldUpdate: boolean;
  isUpdateLoading: boolean;
  insufficientInputBalance?: boolean;
  otherToken?: EnrichedTokenSelect | null;
}) => {
  const [amountString, setAmountString] = useState<string>("");
  const [justTyped, setJustTyped] = useState(false);

  // Handle user input changes
  useEffect(() => {
    if (!justTyped) {
      return;
    }
    setJustTyped(false);
    try {
      if (!token) {
        setAmount(null);
        return;
      }
      const parsed = utils.parseUnits(amountString, token.decimals);
      setAmount(parsed);
    } catch (e) {
      setAmount(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountString]);

  // Reset amount when token changes
  useEffect(() => {
    if (token) {
      setAmountString("");
    }
  }, [token]);

  // Handle quote updates - only update the field that should receive the quote
  useEffect(() => {
    if (shouldUpdate && isUpdateLoading) {
      setAmountString("");
    }

    if (expectedAmount && token && shouldUpdate) {
      setAmountString(
        formatUnitsWithMaxFractions(expectedAmount, token.decimals)
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedAmount, isUpdateLoading]);

  const estimatedUsdAmount = useMemo(() => {
    try {
      const amount = utils.parseUnits(amountString, token!.decimals);
      if (!token) {
        return null;
      }
      const priceAsNumeric = Number(utils.formatUnits(token.priceUsd, 18));
      const amountAsNumeric = Number(utils.formatUnits(amount, token.decimals));
      const estimatedUsdAmountNumeric = amountAsNumeric * priceAsNumeric;
      const estimatedUsdAmount = utils.parseUnits(
        estimatedUsdAmountNumeric.toString(),
        18
      );
      return formatUSD(estimatedUsdAmount);
    } catch (e) {
      return null;
    }
  }, [amountString, token]);

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>
          {isOrigin ? "From" : "To"}
        </TokenAmountInputTitle>
        <TokenAmountInput
          placeholder="0.00"
          value={amountString}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
              setJustTyped(true);
              setAmountString(value);
            }
          }}
          disabled={shouldUpdate && isUpdateLoading}
          error={insufficientInputBalance}
        />
        <TokenAmountInputEstimatedUsd>
          <ValueRow>
            <ArrowsCross width={16} height={16} />{" "}
            <span>Value: ${estimatedUsdAmount ?? "0.00"}</span>
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
                setAmount(amount);
                setAmountString(
                  formatUnitsWithMaxFractions(amount, token.decimals)
                );
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
  width: 48px;
  height: 32px;

  padding: 0px 16px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 32px;
  border: 1px solid #4c4e57;
  background: ${COLORS["black-700"]};
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
  cursor: pointer;

  & * {
    flex-shrink: 0;
  }
`;

const QuickSwapButtonWrapper = styled.div`
  position: absolute;
  left: calc(50% - 24px);
  top: calc(50% - 16px);

  z-index: 4;
`;
