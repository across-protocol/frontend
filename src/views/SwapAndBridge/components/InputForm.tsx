import {
  COLORS,
  fixedPointAdjustment,
  formatUnitsWithMaxFractions,
  formatUSD,
} from "utils";
import SelectorButton, {
  EnrichedTokenSelect,
} from "./ChainTokenSelector/SelectorButton";
import BalanceSelector from "./BalanceSelector";
import styled from "@emotion/styled";
import { useEffect, useMemo, useState } from "react";
import { BigNumber, utils } from "ethers";
import useSwapQuote from "../hooks/useSwapQuote";

export const InputForm = ({
  inputToken,
  outputToken,
  setInputToken,
  setOutputToken,
  setAmount,
  isAmountOrigin,
  setIsAmountOrigin,
  amount,
}: {
  inputToken: EnrichedTokenSelect | null;
  setInputToken: (token: EnrichedTokenSelect) => void;

  outputToken: EnrichedTokenSelect | null;
  setOutputToken: (token: EnrichedTokenSelect) => void;

  amount: BigNumber | null;
  setAmount: (amount: BigNumber | null) => void;

  isAmountOrigin: boolean;
  setIsAmountOrigin: (isAmountOrigin: boolean) => void;
}) => {
  const { data: swapData, isLoading: isUpdateLoading } = useSwapQuote({
    origin: inputToken
      ? {
          address: inputToken.address,
          chainId: inputToken.chainId,
        }
      : null,
    destination: outputToken
      ? {
          address: outputToken.address,
          chainId: outputToken.chainId,
        }
      : null,
    amount: amount,
    isInputAmount: isAmountOrigin,
  });

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
        expectedAmount={swapData?.inputAmount}
        shouldUpdate={!isAmountOrigin}
        isUpdateLoading={isUpdateLoading}
      />
      <TokenInput
        setToken={setOutputToken}
        token={outputToken}
        setAmount={(amount) => {
          setAmount(amount);
          setIsAmountOrigin(false);
        }}
        isOrigin={false}
        expectedAmount={swapData?.expectedOutputAmount}
        shouldUpdate={isAmountOrigin}
        isUpdateLoading={isUpdateLoading}
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

  // Handle user input changes
  useEffect(() => {
    if (amountString && expectedAmount) {
      const priceDelta = Math.abs(
        Number(amountString) -
          Number(formatUnitsWithMaxFractions(expectedAmount, token!.decimals))
      );
      if (priceDelta < 0.01 && !isUpdateLoading) {
        return;
      }
    }
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
      return formatUSD(amount.mul(token.priceUsd).div(fixedPointAdjustment));
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
      />
      {token && (
        <BalanceSelectorWrapper>
          <BalanceSelector
            balance={token.balance}
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
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;
  padding: 12px;
  border-radius: 24px;
  border: 1px solid rgba(224, 243, 255, 0.05);
  background: #34353b;
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
`;
