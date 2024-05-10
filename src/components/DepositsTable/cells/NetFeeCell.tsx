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
  formatUnitsWithMaxFractions,
  formatWeiPct,
  getConfig,
  getToken,
  isBigNumberish,
  formatMaxFracDigits,
} from "utils";

type Props = {
  deposit: Deposit;
  width: number;
};

export function NetFeeCell({ deposit, width }: Props) {
  const feeCellValue =
    !deposit.feeBreakdown || Object.keys(deposit.feeBreakdown).length === 0 ? (
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
        {formatUnitsWithMaxFractions(
          BigNumber.from(deposit.amount)
            .mul(deposit.depositRelayerFeePct || 0)
            .div(fixedPointAdjustment),
          tokenInfo.decimals
        )}{" "}
        {tokenInfo.symbol}
      </Text>
      <Text size="sm" color="grey-400">
        {formatWeiPct(deposit.depositRelayerFeePct || 0, 3)}%
      </Text>
    </>
  );
}

function FeeWithBreakdown({ deposit }: { deposit: Deposit }) {
  const netFee =
    Number(deposit.feeBreakdown?.totalBridgeFeeUsd || 0) +
    Number(deposit.feeBreakdown?.swapFeeUsd || 0) -
    Number(deposit.rewards?.usd || 0);

  const tokenInfo = getConfig().getTokenInfoByAddress(
    deposit.sourceChainId,
    deposit.swapToken?.address || deposit.token?.address || deposit.assetAddr
  );
  const rewardToken = deposit.rewards
    ? getToken(deposit.rewards.type === "op-rebates" ? "OP" : "ACX")
    : undefined;

  const capitalAndLpFeeUsd =
    Number(deposit.feeBreakdown?.totalBridgeFeeUsd || 0) -
    Number(deposit.feeBreakdown?.relayGasFeeUsd || 0);
  const capitalAndLpFeeAmount = BigNumber.from(
    isBigNumberish(deposit.feeBreakdown?.totalBridgeFeeAmount)
      ? deposit.feeBreakdown?.totalBridgeFeeAmount || 0
      : 0
  ).sub(
    BigNumber.from(
      isBigNumberish(deposit.feeBreakdown?.relayGasFeeAmount)
        ? deposit.feeBreakdown?.relayGasFeeAmount || 0
        : 0
    )
  );

  const swapFeeUsd = Number(deposit.feeBreakdown?.swapFeeUsd || 0);
  const swapFeeAmount = BigNumber.from(
    isBigNumberish(deposit.feeBreakdown?.swapFeeAmount)
      ? deposit.feeBreakdown?.swapFeeAmount || 0
      : 0
  );

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
              {swapFeeUsd > 0 && swapFeeAmount.gt(0) && (
                <FeeBreakdownRow>
                  <Text size="sm" color="grey-400">
                    Swap fee
                  </Text>
                  <FeeValueWrapper>
                    <Text size="sm" color="grey-400">
                      ${formatMaxFracDigits(swapFeeUsd, 2)}
                    </Text>
                    <Text size="sm" color="light-200">
                      {formatUnitsWithMaxFractions(
                        swapFeeAmount,
                        tokenInfo.decimals
                      )}{" "}
                      {tokenInfo.symbol}
                    </Text>
                    <img src={tokenInfo.logoURI} alt={tokenInfo.symbol} />
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
                  <Text size="sm" color="light-200">
                    {formatUnitsWithMaxFractions(
                      capitalAndLpFeeAmount,
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
                    {formatMaxFracDigits(
                      Number(deposit.feeBreakdown?.relayGasFeeUsd || 0),
                      4
                    )}
                  </Text>
                  <Text size="sm" color="light-200">
                    {formatUnitsWithMaxFractions(
                      BigNumber.from(
                        isBigNumberish(deposit.feeBreakdown?.relayGasFeeAmount)
                          ? deposit.feeBreakdown?.relayGasFeeAmount || 0
                          : 0
                      ),
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
