import styled from "@emotion/styled";
import { formatWeiPct, getChainInfo, makeFormatUnits } from "utils";

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
        <div>Asset</div>
        <div>
          {token.symbol}{" "}
          <img src={token.logoURI} alt={`token_logo_${token.symbol}`} />
        </div>
      </StatRow>
      <StatRow>
        <div>From → To</div>
        <div>
          {getChainInfo(transfer.sourceChainId).name} →{" "}
          {getChainInfo(transfer.destinationChainId).name}
        </div>
      </StatRow>
      <StatRow>
        <div>Amount</div>
        <div>{formatTokenUnits(transfer.amount)}</div>
      </StatRow>
      <StatRow>
        <div>Current fee %</div>
        <div>{formatWeiPct(transfer.depositRelayerFeePct)}%</div>
      </StatRow>
      <StatRow>
        <div>Current fee in {token.symbol}</div>
        <div>
          {formatTokenUnits(
            calcPctOfTokenAmount(transfer.depositRelayerFeePct, transfer.amount)
          )}
        </div>
      </StatRow>
      <Divider />
      <StatRow highlightValue>
        <div>New fee %</div>
        <div>{hideNewFee ? "-" : appendPercentageSign(feeInput)}</div>
      </StatRow>
      <StatRow highlightValue>
        <div>New fee in {token.symbol}</div>
        <div>
          {hideNewFee
            ? "-"
            : formatTokenUnits(
                calcPctOfTokenAmount(
                  feeInputToBigNumberPct(feeInput || "0"),
                  transfer.amount
                )
              )}
        </div>
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
