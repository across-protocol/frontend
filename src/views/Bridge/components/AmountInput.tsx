import styled from "@emotion/styled";
import { useState, useEffect } from "react";
import { BigNumber, utils } from "ethers";

import { Text } from "components/Text";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";
import { QUERIESV2, Route, getToken } from "utils";

import BridgeInputErrorAlert from "./BridgeAlert";
import { AmountInputError } from "../utils";

type Props = {
  balance?: BigNumber;
  amountInput: string;
  parsedAmountInput?: BigNumber;
  onChangeAmountInput: (input: string) => void;
  onClickMaxBalance: () => void;
  selectedRoute: Route;
  validationError?: AmountInputError;
};

export function AmountInput({
  balance,
  amountInput,
  onChangeAmountInput,
  onClickMaxBalance,
  selectedRoute,
  validationError,
}: Props) {
  const [displayBalance, setDisplayBalance] = useState(false);
  const [didFocus, setDidFocus] = useState(false);

  useEffect(() => {
    setDidFocus(false);
  }, [selectedRoute.fromTokenSymbol]);

  const token = getToken(selectedRoute.fromTokenSymbol);

  const isAmountValid = !Boolean(validationError);

  return (
    <AmountExternalWrapper>
      <AmountWrapper valid={didFocus ? isAmountValid : true}>
        <AmountInnerWrapper>
          <AmountInnerWrapperTextStack>
            {balance && (displayBalance || amountInput) && (
              <Text size="sm" color="grey-400">
                Balance: {utils.formatUnits(balance, token.decimals)}{" "}
                {token.displaySymbol || token.symbol.toUpperCase()}
              </Text>
            )}
            <AmountInnerInput
              valid={didFocus ? isAmountValid : true}
              placeholder="Enter amount"
              value={amountInput}
              onChange={(e) => onChangeAmountInput(e.target.value)}
              onFocus={() => {
                setDisplayBalance(true);
              }}
              onBlur={() => {
                setDidFocus(true);
                setDisplayBalance(false);
              }}
              data-cy="bridge-amount-input"
            />
          </AmountInnerWrapperTextStack>
          <MaxButtonWrapper
            onClick={() => {
              setDidFocus(true);
              onClickMaxBalance();
            }}
            disabled={!balance}
          >
            MAX
          </MaxButtonWrapper>
        </AmountInnerWrapper>
      </AmountWrapper>
      {didFocus && !isAmountValid && (
        <BridgeInputErrorAlert>
          {validationError === AmountInputError.INSUFFICIENT_BALANCE &&
            "Insufficient balance to process this transfer."}
          {validationError === AmountInputError.INSUFFICIENT_LIQUIDITY &&
            "Insufficient bridge liquidity to process this transfer."}
          {validationError === AmountInputError.NEGATIVE_AMOUNT &&
            "Only positive numbers are allowed as an input."}
          {validationError === AmountInputError.AMOUNT_TOO_LOW &&
            "The amount you are trying to bridge is too low."}
          {validationError === AmountInputError.INVALID && "Input is invalid."}
        </BridgeInputErrorAlert>
      )}
    </AmountExternalWrapper>
  );
}

export default AmountInput;

interface IValidInput {
  valid: boolean;
}

const AmountWrapper = styled.div<IValidInput>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 9px 20px 9px 32px;
  background: #2d2e33;
  border: 1px solid ${({ valid }) => (!valid ? "#f96c6c" : "#4c4e57")};
  border-radius: 32px;

  width: 100%;
  height: 64px;

  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    height: 48px;
    padding: 6px 12px 6px 24px;
  }
`;

const AmountExternalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  width: calc(70% - 6px);
  flex-shrink: 0;
  @media ${QUERIESV2.xs.andDown} {
    width: 100%;
  }
`;

const AmountInnerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  padding: 0px;
  gap: 16px;
  width: 100%;
`;

const MaxButtonWrapper = styled(UnstyledButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 10px;

  height: 24px;
  width: fit-content;

  border: 1px solid #4c4e57;
  border-radius: 24px;

  cursor: pointer;

  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #c5d5e0;

  &:hover {
    color: #e0f3ff;
    border-color: #e0f3ff;
  }
`;

const AmountInnerWrapperTextStack = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-start;
  padding: 0px;
`;

const AmountInnerInput = styled.input<IValidInput>`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;

  color: ${({ valid }) => (!valid ? "#f96c6c" : "#e0f3ff")};
  background: none;

  width: 100%;
  padding: 0;
  border: none;
  outline: 0;

  &:focus {
    outline: 0;
    font-size: 18px;
  }

  &::placeholder {
    color: #9daab3;
  }

  overflow-x: hidden;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 16px;
    line-height: 20px;
  }
`;
