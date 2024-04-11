import styled from "@emotion/styled";
import { useState, useEffect } from "react";
import { BigNumber, utils } from "ethers";

import { Text } from "components/Text";
import { UnstyledButton } from "components/Button";
import { Tooltip } from "components/Tooltip";
import { IconPair } from "components/IconPair";
import {
  QUERIESV2,
  getToken,
  isDefined,
  formatUnitsWithMaxFractions,
} from "utils";
import { ReactComponent as II } from "assets/icons/info-16.svg";
import { ReactComponent as WalletIcon } from "assets/icons/wallet.svg";

export type Props = {
  balance?: BigNumber;
  displayBalance?: boolean;
  amountInput: string;
  onChangeAmountInput: (input: string) => void;
  onClickMaxBalance: () => void;
  inputTokenSymbol: string;
  validationError?: string;
  dataCy?: string;
  disableErrorText?: boolean;
  disableInput?: boolean;
  disableMaxButton?: boolean;
  displayTokenIcon?: boolean;
};

export function AmountInput({
  dataCy,
  balance,
  amountInput,
  displayBalance,
  onChangeAmountInput,
  onClickMaxBalance,
  inputTokenSymbol,
  validationError,
  disableErrorText,
  disableInput,
  disableMaxButton,
  displayTokenIcon,
}: Props) {
  const [didEnter, setDidEnter] = useState(false);

  useEffect(() => {
    setDidEnter(false);
  }, [inputTokenSymbol]);

  const token = getToken(inputTokenSymbol);

  const isAmountValid =
    (amountInput ?? "") === "" || !isDefined(validationError);

  return (
    <Wrapper>
      <InputGroupWrapper valid={didEnter ? isAmountValid : true}>
        {displayTokenIcon ? (
          token.logoURIs ? (
            <IconPairContainer>
              <IconPair
                LeftIcon={<TokenIcon src={token.logoURIs[0]} />}
                RightIcon={<TokenIcon src={token.logoURIs[1]} />}
                iconSize={16}
              />
            </IconPairContainer>
          ) : (
            <TokenIcon src={token.logoURI} />
          )
        ) : null}
        <Input
          type="number"
          valid={didEnter ? isAmountValid : true}
          placeholder="Enter amount"
          value={amountInput}
          onWheel={(e) => e.currentTarget.blur()}
          onChange={(e) => {
            if (!didEnter) {
              setDidEnter(true);
            }
            const parsedInput = Number(e.target.value);
            if (parsedInput < 0 || isNaN(parsedInput)) {
              return;
            }
            onChangeAmountInput(e.target.value);
          }}
          data-cy={dataCy}
          disabled={disableInput}
        />
        <BalanceAndMaxWrapper>
          {displayBalance && balance && (
            <Tooltip
              tooltipId="balance-detailed"
              body={
                <Text size="md">
                  {utils.formatUnits(balance, token.decimals)}
                </Text>
              }
            >
              <BalanceWrapper>
                <BalanceText size="md" color="grey-400">
                  {formatUnitsWithMaxFractions(balance, token.decimals)}
                </BalanceText>
                <WalletIcon />
              </BalanceWrapper>
            </Tooltip>
          )}
          <MaxButtonWrapper
            onClick={() => {
              if (!didEnter) {
                setDidEnter(true);
              }
              onClickMaxBalance();
            }}
            disabled={disableMaxButton}
          >
            MAX
          </MaxButtonWrapper>
        </BalanceAndMaxWrapper>
      </InputGroupWrapper>
      {didEnter && !isAmountValid && !disableErrorText && (
        <ErrorWrapper>
          <ErrorIcon />
          <Text size="sm" color="error">
            {validationError}
          </Text>
        </ErrorWrapper>
      )}
    </Wrapper>
  );
}

export default AmountInput;

interface IValidInput {
  valid: boolean;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const InputGroupWrapper = styled.div<IValidInput>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 9px 12px 9px 16px;
  background: #2d2e33;
  border: 1px solid ${({ valid }) => (valid ? "#3E4047" : "#f96c6c")};
  border-radius: 12px;
  height: 48px;
  gap: 8px;

  @media ${QUERIESV2.sm.andDown} {
    padding: 6px 12px 6px 24px;
  }
`;

const Input = styled.input<IValidInput>`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;

  color: ${({ valid }) => (valid ? "#e0f3ff" : "#f96c6c")};
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

  // hide number input arrows
  /* Chrome, Safari, Edge, Opera */
  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  -moz-appearance: textfield;
  appearance: textfield;
`;

const BalanceAndMaxWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const BalanceWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;

  cursor: default;
`;

const BalanceText = styled(Text)`
  max-width: 60px;
  overflow: hidden;
  white-space: nowrap;

  text-overflow: ellipsis;
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
  border-radius: 6px;

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

  @media ${QUERIESV2.sm.andDown} {
    padding: 0 10px;
    height: 24px;
    font-size: 12px;
    line-height: 14px;
  }
`;

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end;
  padding: 0px;
  gap: 8px;

  width: 100%;
`;

const ErrorIcon = styled(II)`
  height: 16px;
  width: 16px;

  & path {
    stroke: #f96c6c !important;
  }
`;

const TokenIcon = styled.img`
  height: 16px;
  width: 16px;
`;

const IconPairContainer = styled.div`
  padding-top: 0px;
  margin-right: 8px;
`;
