import { COLORS, formatUnitsWithMaxFractions, formatUSD } from "utils";
import SelectorButton, {
  EnrichedTokenSelect,
} from "./ChainTokenSelector/SelectorButton";
import BalanceSelector from "./BalanceSelector";
import styled from "@emotion/styled";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber, utils } from "ethers";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";

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
}: {
  setToken: (token: EnrichedTokenSelect) => void;
  token: EnrichedTokenSelect | null;
  setAmount: (amount: BigNumber | null) => void;
  isOrigin: boolean;
  expectedAmount: string | undefined;
  shouldUpdate: boolean;
  isUpdateLoading: boolean;
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
      setAmount(utils.parseUnits(amountString, token!.decimals));
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
          {isOrigin ? "Sell" : "Buy"}
        </TokenAmountInputTitle>
        <TokenAmountInput
          placeholder="0.00"
          value={amountString}
          onChange={(e) => {
            setJustTyped(true);
            setAmountString(e.target.value);
          }}
          disabled={shouldUpdate && isUpdateLoading}
        />
        <TokenAmountInputEstimatedUsd>
          {estimatedUsdAmount && <>Value: ~${estimatedUsdAmount}</>}
        </TokenAmountInputEstimatedUsd>
      </TokenAmountStack>
      <SelectorButton
        onSelect={setToken}
        isOriginToken={isOrigin}
        marginBottom={token ? "24px" : "0px"}
        selectedToken={token}
      />
      {token && (
        <BalanceSelectorWrapper>
          <BalanceSelector
            balance={token.balance}
            disableHover={!isOrigin}
            decimals={token.decimals}
            setAmount={(amount) => {
              if (amount) {
                setAmount(amount);
                setAmountString(
                  formatUnitsWithMaxFractions(amount, token.decimals)
                );
              }
            }}
          />
        </BalanceSelectorWrapper>
      )}
    </TokenInputWrapper>
  );
};

const TokenAmountStack = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;

  height: 100%;
`;

const TokenAmountInputTitle = styled.div`
  color: ${() => COLORS.aqua};
  font-size: 16px;
  font-weight: 400;
  line-height: 130%;
`;

const TokenAmountInput = styled.input`
  color: #e0f3ff;
  font-family: Barlow;
  font-size: 48px;
  font-weight: 300;
  line-height: 120%;
  letter-spacing: -1.92px;

  outline: none;
  border: none;
  background: transparent;

  flex-shrink: 0;

  &:focus {
    font-size: 48px;
  }
`;

const TokenAmountInputEstimatedUsd = styled.div`
  color: #e0f3ff;
  font-family: Barlow;
  font-size: 14px;
  font-weight: 400;
  line-height: 130%;
`;

const TokenInputWrapper = styled.div`
  display: flex;
  height: 132px;
  padding: 16px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  border-radius: 12px;
  border: 1px solid rgba(224, 243, 255, 0.05);
  background: #2d2e32;
  position: relative;
`;

const BalanceSelectorWrapper = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
`;

const Wrapper = styled.div`
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  align-self: stretch;
  padding: 12px;
  border-radius: 24px;
  border: 1px solid rgba(224, 243, 255, 0.05);
  background: #34353b;
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
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
  background: #34353b;
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
