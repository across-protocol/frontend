import styled from "@emotion/styled";

import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { BigNumber } from "ethers";

import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";
import {
  COLORS,
  isBigNumberish,
  formatMaxFracDigits,
  getRewardToken,
} from "utils";

type Props = {
  deposit: Deposit;
  width: number;
};

export function NetFeeCell({ deposit, width }: Props) {
  const feeCellValue =
    !deposit.feeBreakdown || Object.keys(deposit.feeBreakdown).length === 0 ? (
      <FeeWithoutBreakdown />
    ) : (
      <FeeWithBreakdown deposit={deposit} />
    );

  return <StyledFeeCell width={width}>{feeCellValue}</StyledFeeCell>;
}

function FeeWithoutBreakdown() {
  return (
    <>
      <Text color="light-200">-</Text>
    </>
  );
}

function FeeWithBreakdown({ deposit }: { deposit: Deposit }) {
  const netFee =
    Number(deposit.feeBreakdown?.totalBridgeFeeUsd || 0) +
    Number(deposit.feeBreakdown?.swapFeeUsd || 0) -
    Number(deposit.rewards?.usd || 0);
  const rewardToken = getRewardToken(deposit);
  const capitalAndLpFeeUsd =
    Number(deposit.feeBreakdown?.totalBridgeFeeUsd || 0) -
    Number(deposit.feeBreakdown?.relayGasFeeUsd || 0);
  const swapFeeUsd = Number(deposit.feeBreakdown?.swapFeeUsd || 0);

  return (
    <>
      <Text color="light-200">${netFee.toFixed(2)}</Text>
      <LowerRow>
        <Text size="sm" color="grey-400">
          Fee breakdown
        </Text>
        <Tooltip
          tooltipId={`fee-breakdown-${deposit.depositTxHash}`}
          placement="bottom-start"
          title="Fee breakdown"
          maxWidth={400}
          body={
            <FeeBreakdownTooltipBody>
              <FeeBreakdownRow>
                <Text size="sm" color="grey-400">
                  Net fee
                </Text>
                <Text size="sm" color="light-100">
                  ${formatMaxFracDigits(netFee, 2)}
                </Text>
              </FeeBreakdownRow>
              <Divider />
              {swapFeeUsd > 0 && (
                <FeeBreakdownRow>
                  <Text size="sm" color="grey-400">
                    Swap fee
                  </Text>
                  <FeeValueWrapper>
                    <Text size="sm" color="grey-400">
                      ${formatMaxFracDigits(swapFeeUsd, 2)}
                    </Text>
                  </FeeValueWrapper>
                </FeeBreakdownRow>
              )}
              <FeeBreakdownRow>
                <Text size="sm" color="grey-400">
                  Bridge fee
                </Text>
                <FeeValueWrapper>
                  <Text size="sm" color="grey-400">
                    ${formatMaxFracDigits(capitalAndLpFeeUsd, 2)}
                  </Text>
                </FeeValueWrapper>
              </FeeBreakdownRow>
              <FeeBreakdownRow>
                <Text size="sm" color="grey-400">
                  Destination gas fee
                </Text>
                <FeeValueWrapper>
                  <Text size="sm" color="grey-400">
                    $
                    {formatMaxFracDigits(
                      Number(deposit.feeBreakdown?.relayGasFeeUsd || 0),
                      4
                    )}
                  </Text>
                </FeeValueWrapper>
              </FeeBreakdownRow>
              {deposit.rewards && rewardToken && (
                <FeeBreakdownRow>
                  <Text size="sm" color="grey-400">
                    Rewards
                  </Text>
                  <FeeValueWrapper>
                    <Text size="sm" color="aqua">
                      ${formatMaxFracDigits(Number(deposit.rewards.usd), 4)}
                    </Text>
                    <img src={rewardToken.logoURI} alt={rewardToken.symbol} />
                  </FeeValueWrapper>
                </FeeBreakdownRow>
              )}
            </FeeBreakdownTooltipBody>
          }
        >
          <StyledInfoIcon />
        </Tooltip>
      </LowerRow>
    </>
  );
}

const StyledFeeCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const LowerRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const StyledInfoIcon = styled(InfoIcon)`
  height: 16px;
  width: 16px;

  > path {
    stroke: ${COLORS["grey-400"]};
  }
`;

const FeeBreakdownTooltipBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 0px;
  gap: 12px;
  width: 320px;
`;

const FeeBreakdownRow = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
`;

const Divider = styled.div`
  width: 100%;
  border-top: 1px solid ${COLORS["black-800"]};
`;

const FeeValueWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  > img {
    height: 16px;
    width: 16px;
  }
`;
