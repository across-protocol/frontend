import styled from "@emotion/styled";

import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";
import { BigNumber } from "ethers";

import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";
import {
  COLORS,
  fixedPointAdjustment,
  formatUnits,
  formatWeiPct,
  getConfig,
  getToken,
} from "utils";

type Props = {
  deposit: Deposit;
  width: number;
};

export function FeeCell({ deposit, width }: Props) {
  const feeCellValue = !deposit.feeBreakdown ? (
    <FeeWithoutBreakdown deposit={deposit} />
  ) : (
    <FeeWithBreakdown deposit={deposit} />
  );

  return <StyledFeeCell width={width}>{feeCellValue}</StyledFeeCell>;
}

function FeeWithoutBreakdown({ deposit }: { deposit: Deposit }) {
  const tokenInfo = getConfig().getTokenInfoByAddress(
    deposit.sourceChainId,
    deposit.assetAddr
  );

  return (
    <>
      <Text color="light-200">
        {formatUnits(
          BigNumber.from(deposit.amount)
            .mul(deposit.depositRelayerFeePct)
            .div(fixedPointAdjustment),
          tokenInfo.decimals
        )}{" "}
        {tokenInfo.symbol}
      </Text>
      <Text size="sm" color="grey-400">
        {formatWeiPct(deposit.depositRelayerFeePct, 3)}%
      </Text>
    </>
  );
}

function FeeWithBreakdown({ deposit }: { deposit: Deposit }) {
  const netFee = BigNumber.from(deposit.feeBreakdown?.bridgeFee.usd || 0)
    .add(BigNumber.from(deposit.feeBreakdown?.destinationGasFee.usd || 0))
    .sub(BigNumber.from(deposit.rewards?.usd || 0));

  const tokenInfo = getConfig().getTokenInfoByAddress(
    deposit.sourceChainId,
    deposit.assetAddr
  );
  const rewardToken = deposit.rewards
    ? getToken(deposit.rewards.type === "op-rebates" ? "OP" : "ACX")
    : undefined;

  return (
    <>
      <Text color="light-200">${formatUnits(netFee, 18)}</Text>
      <LowerRow>
        <Text size="sm" color="grey-400">
          Fee breakdown
        </Text>
        <Tooltip
          tooltipId="fee-breakdown"
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
                  ${formatUnits(netFee, 18)}
                </Text>
              </FeeBreakdownRow>
              <Divider />
              <FeeBreakdownRow>
                <Text size="sm" color="grey-400">
                  Bridge fee
                </Text>
                <FeeValueWrapper>
                  <Text size="sm" color="grey-400">
                    ${formatUnits(deposit.feeBreakdown?.bridgeFee.usd || 0, 18)}
                  </Text>
                  <Text size="sm" color="light-200">
                    {formatUnits(
                      BigNumber.from(deposit.feeBreakdown?.bridgeFee.pct || 0)
                        .mul(deposit.amount)
                        .div(fixedPointAdjustment),
                      tokenInfo.decimals
                    )}{" "}
                    {tokenInfo.symbol}
                  </Text>
                  <img src={tokenInfo.logoURI} alt={tokenInfo.symbol} />
                </FeeValueWrapper>
              </FeeBreakdownRow>
              <FeeBreakdownRow>
                <Text size="sm" color="grey-400">
                  Destination gas fee
                </Text>
                <FeeValueWrapper>
                  <Text size="sm" color="grey-400">
                    $
                    {formatUnits(
                      deposit.feeBreakdown?.destinationGasFee.usd || 0,
                      18
                    )}
                  </Text>
                  <Text size="sm" color="light-200">
                    {formatUnits(
                      BigNumber.from(
                        deposit.feeBreakdown?.destinationGasFee.pct || 0
                      )
                        .mul(deposit.amount)
                        .div(fixedPointAdjustment),
                      tokenInfo.decimals
                    )}{" "}
                    {tokenInfo.symbol}
                  </Text>
                  <img src={tokenInfo.logoURI} alt={tokenInfo.symbol} />
                </FeeValueWrapper>
              </FeeBreakdownRow>
              {deposit.rewards && rewardToken && (
                <FeeBreakdownRow>
                  <Text size="sm" color="grey-400">
                    Rewards
                  </Text>
                  <FeeValueWrapper>
                    <Text size="sm" color="aqua">
                      ${formatUnits(deposit.rewards.usd, rewardToken.decimals)}
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
