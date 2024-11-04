import styled from "@emotion/styled";
import { BigNumber, utils } from "ethers";

import { ReactComponent as WalletIcon } from "assets/icons/wallet.svg";
import { UnstyledButton } from "components/Button";
import { IconPair } from "components/IconPair";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { useTokenConversion } from "hooks/useTokenConversion";
import {
  QUERIESV2,
  formatUSD,
  formatUnitsWithMaxFractions,
  getToken,
  isDefined,
  isNumberEthersParseable,
  parseUnits,
} from "utils";

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
  const token = getToken(inputTokenSymbol);

  const isAmountValid =
    (amountInput ?? "") === "" || !isDefined(validationError);

  const { convertTokenToBaseCurrency } = useTokenConversion(
    inputTokenSymbol,
    "usd"
  );

  const inputAmountAsNumeric = isNumberEthersParseable(
    amountInput,
    token.decimals
  )
    ? parseUnits(amountInput, token.decimals)
    : undefined;

  const estimatedUsdInputAmount =
    convertTokenToBaseCurrency(inputAmountAsNumeric);

  return (
    <Wrapper>
      <InputGroupWrapper valid={isAmountValid}>
        {displayTokenIcon ? (
          token.logoURIs?.length === 2 ? (
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
          valid={isAmountValid}
          placeholder="Enter amount"
          value={amountInput}
          onWheel={(e) => e.currentTarget.blur()}
          onChange={(e) => {
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
            onClick={onClickMaxBalance}
            disabled={disableMaxButton}
          >
            MAX
          </MaxButtonWrapper>
        </BalanceAndMaxWrapper>
      </InputGroupWrapper>
      <InfoTextWrapper>
        {estimatedUsdInputAmount && amountInput !== "" && (
          <Text size="md" color="grey-400">
            ${formatUSD(estimatedUsdInputAmount)}
          </Text>
        )}
        {!isAmountValid && !disableErrorText && (
          <Text size="md" color="error">
            {validationError}
          </Text>
        )}
      </InfoTextWrapper>
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
  gap: 8px;
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

const TokenIcon = styled.img`
  height: 16px;
  width: 16px;
`;

const IconPairContainer = styled.div`
  padding-top: 0px;
  margin-right: 8px;
`;

const InfoTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;

  padding-left: 17px; /* 16px padding + 1px border */
`;
