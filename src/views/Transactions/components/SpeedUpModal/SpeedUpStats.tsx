import styled from "@emotion/styled";

import { Text } from "components/Text";
import { COLORS, formatWeiPct, getChainInfo, makeFormatUnits } from "utils";

import {
  appendPercentageSign,
  removePercentageSign,
  feeInputToBigNumberPct,
  calcPctOfTokenAmount,
} from "./utils";
import { SupportedTxTuple } from "../../types";

type Props = {
  transferTokenTuple: SupportedTxTuple;
  feeInput: string;
  inputError?: string;
  isInitiallyFetchingFees: boolean;
};

export function SpeedUpStats({
  transferTokenTuple,
  inputError,
  feeInput,
  isInitiallyFetchingFees,
}: Props) {
  const [token, transfer] = transferTokenTuple;

  const formatTokenUnits = makeFormatUnits(token.decimals);

  const isInputInvalid = isNaN(Number(removePercentageSign(feeInput)));
  const hideNewFee = inputError || isInitiallyFetchingFees || isInputInvalid;

  return (
    <StatsBox>
      <StatRow>
        <Text color="white-70">Asset</Text>
        <Text color="white-70">
          {token.symbol}{" "}
          <img src={token.logoURI} alt={`token_logo_${token.symbol}`} />
        </Text>
      </StatRow>
      <StatRow>
        <Text color="white-70">From → To</Text>
        <Text color="white-70">
          {getChainInfo(transfer.sourceChainId).name} →{" "}
          {getChainInfo(transfer.destinationChainId).name}
        </Text>
      </StatRow>
      <StatRow>
        <Text color="white-70">Amount</Text>
        <Text color="white-70">{formatTokenUnits(transfer.amount)}</Text>
      </StatRow>
      <StatRow>
        <Text color="white-70">Current fee %</Text>
        <Text color="white-70">
          {formatWeiPct(transfer.depositRelayerFeePct)}%
        </Text>
      </StatRow>
      <StatRow>
        <Text color="white-70">Current fee in {token.symbol}</Text>
        <Text color="white-70">
          {formatTokenUnits(
            calcPctOfTokenAmount(transfer.depositRelayerFeePct, transfer.amount)
          )}
        </Text>
      </StatRow>
      <Divider />
      <StatRow highlightValue>
        <Text color="white-70">New fee %</Text>
        <Text color="white-70">
          {hideNewFee ? "-" : appendPercentageSign(feeInput)}
        </Text>
      </StatRow>
      <StatRow highlightValue>
        <Text color="white-70">New fee in {token.symbol}</Text>
        <Text color="white-70">
          {hideNewFee
            ? "-"
            : formatTokenUnits(
                calcPctOfTokenAmount(
                  feeInputToBigNumberPct(feeInput || "0"),
                  transfer.amount
                )
              )}
        </Text>
      </StatRow>
    </StatsBox>
  );
}

const StatsBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
  background-color: ${COLORS["black-800"]};

  border: 1px solid #34353b;
  border-radius: 12px;
`;

const StatRow = styled.div<{ highlightValue?: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  color: #9daab2;
  font-weight: 400;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;

  div:nth-of-type(2) {
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${({ highlightValue }) => (highlightValue ? "#E0F3FF" : "inherit")};
  }

  img {
    height: 16px;
    width: 16px;
  }
`;

const Divider = styled.div`
  display: flex;
  width: 100%;
  border-top: 1px solid #34353b;
`;
