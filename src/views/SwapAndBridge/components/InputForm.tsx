import { COLORS, fixedPointAdjustment, formatUSD } from "utils";
import SelectorButton, {
  EnrichedTokenSelect,
} from "./ChainTokenSelector/SelectorButton";
import styled from "@emotion/styled";
import { useEffect, useMemo, useState } from "react";
import { BigNumber, utils } from "ethers";

export const InputForm = ({
  inputToken,
  outputToken,
  setInputToken,
  setOutputToken,
  setAmount,
  setIsAmountOrigin,
}: {
  inputToken: EnrichedTokenSelect | null;
  setInputToken: (token: EnrichedTokenSelect) => void;

  outputToken: EnrichedTokenSelect | null;
  setOutputToken: (token: EnrichedTokenSelect) => void;

  setAmount: (amount: BigNumber | null) => void;
  setIsAmountOrigin: (isAmountOrigin: boolean) => void;
}) => {
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
      />
      <TokenInput
        setToken={setOutputToken}
        token={outputToken}
        setAmount={(amount) => {
          setAmount(amount);
          setIsAmountOrigin(false);
        }}
        isOrigin={false}
      />
    </Wrapper>
  );
};

const TokenInput = ({
  setToken,
  token,
  setAmount,
  isOrigin,
}: {
  setToken: (token: EnrichedTokenSelect) => void;
  token: EnrichedTokenSelect | null;
  setAmount: (amount: BigNumber | null) => void;
  isOrigin: boolean;
}) => {
  const [amountString, setAmountString] = useState<string>("");

  useEffect(() => {
    try {
      setAmount(utils.parseUnits(amountString, token!.decimals));
    } catch (e) {
      setAmount(null);
    }
  }, [amountString, token, setAmount]);

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
          value={amountString}
          onChange={(e) => setAmountString(e.target.value)}
        />
        {estimatedUsdAmount && (
          <TokenAmountInputEstimatedUsd>
            Value: ~${estimatedUsdAmount}
          </TokenAmountInputEstimatedUsd>
        )}
      </TokenAmountStack>
      <SelectorButton onSelect={setToken} isOriginToken={isOrigin} />
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
  color: ${() => COLORS.aqua};
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
