import styled from "@emotion/styled";
import { utils } from "ethers";
import { formatWeiPct, getChainInfo, formatUnits } from "utils";

import { appendPercentageSign, feeInputToBigNumberPct } from "./utils";
import { SupportedTxTuple } from "../../types";

type Props = {
  transferTokenTuple: SupportedTxTuple;
  feeInput: string;
  inputError?: string;
};

// TODO: replace with `currentRelayerFee` of transfer if sdk is updated
const mockedCurrentRelayFeeWei = utils.parseEther("0.01"); // 1 %

export function SpeedUpStats({
  transferTokenTuple,
  inputError,
  feeInput,
}: Props) {
  const [token, transfer] = transferTokenTuple;

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
        <div>{formatUnits(transfer.amount, token.decimals).toString()}</div>
      </StatRow>
      <StatRow>
        <div>Current fee %</div>
        <div>{formatWeiPct(mockedCurrentRelayFeeWei)}%</div>
      </StatRow>
      <StatRow>
        <div>Current fee in {token.symbol}</div>
        <div>
          {formatUnits(
            mockedCurrentRelayFeeWei
              .mul(transfer.amount)
              .div(utils.parseEther("1")),
            token.decimals
          ).toString()}
        </div>
      </StatRow>
      <Divider />
      <StatRow highlightValue>
        <div>New fee %</div>
        <div>{inputError ? "invalid " : appendPercentageSign(feeInput)}</div>
      </StatRow>
      <StatRow highlightValue>
        <div>New fee in {token.symbol}</div>
        <div>
          {inputError
            ? "invalid"
            : formatUnits(
                feeInputToBigNumberPct(feeInput || "0")
                  .mul(transfer.amount)
                  .div(utils.parseEther("1")),
                token.decimals
              ).toString()}
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
