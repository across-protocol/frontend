import styled from "@emotion/styled";
import { useState } from "react";
import { COLORS, QUERIESV2 } from "utils/constants";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { ReactComponent as ChevronIcon } from "assets/icons/chevron-down.svg";
import { ReactComponent as DollarIcon } from "assets/icons/dollar.svg";

import {
  DetailRowGroup,
  SectionCard,
  SectionHeader,
  SectionHeaderCollapsible,
} from "./TransactionSection.styles";

type TransactionFeeSectionProps = {
  bridgeFeeUsd: string | null;
  fillGasFee: string | null;
  fillGasFeeUsd: string | null;
  swapFeeUsd?: string | null;
  formatUSDValue: (value: string | null) => string;
};

export function TransactionFeeSection({
  bridgeFeeUsd,
  fillGasFeeUsd,
  swapFeeUsd,
  formatUSDValue,
}: TransactionFeeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateTotalFee = () => {
    const bridgeFee = parseFloat(bridgeFeeUsd || "0");
    const gasFee = parseFloat(fillGasFeeUsd || "0");
    const swapFee = parseFloat(swapFeeUsd || "0");
    const total = bridgeFee + gasFee + swapFee;
    return total > 0 ? `$${total.toFixed(2)}` : "$0.00";
  };

  return (
    <FeeCard>
      <FeeHeader collapsible onClick={() => setIsExpanded(!isExpanded)}>
        <ToolTipWrapper>
          <DollarIcon width="24px" height="24px" />
          <Text color="light-200" size="md" weight={600}>
            Total fees
          </Text>
          <Tooltip
            body="Combined bridge fee, gas fee, and swap fee (if applicable)."
            title="Total fees"
            placement="bottom-start"
          >
            <InfoIconWrapper>
              <InfoIcon />
            </InfoIconWrapper>
          </Tooltip>
        </ToolTipWrapper>
        <ChevronIconWrapper>
          <Text size="md" color="light-200">
            {calculateTotalFee()}
          </Text>
          <ChevronIconStyled isExpanded={isExpanded} />
        </ChevronIconWrapper>
      </FeeHeader>

      {isExpanded && (
        <FeeItemWrapper>
          <InnerRow>
            <FeeItemVector />
            <ToolTipWrapper>
              <Text size="md" color="grey-400">
                Bridge fee
              </Text>
              <Tooltip
                title="Bridge fee"
                body="Fee paid to Across Liquidity Providers and Relayers."
                placement="bottom-start"
              >
                <InfoIconWrapper>
                  <InfoIcon />
                </InfoIconWrapper>
              </Tooltip>
            </ToolTipWrapper>
            <FeeItemValue color="grey-400" size="md">
              {formatUSDValue(bridgeFeeUsd)}
            </FeeItemValue>
          </InnerRow>

          <InnerRow>
            <FeeItemVector />
            <ToolTipWrapper>
              <Text size="md" color="grey-400">
                Destination gas fee
              </Text>
              <Tooltip
                title="Destination gas fee"
                body="Fee to cover gas for destination chain fill transaction."
                placement="bottom-start"
              >
                <InfoIconWrapper>
                  <InfoIcon />
                </InfoIconWrapper>
              </Tooltip>
            </ToolTipWrapper>
            <FeeItemValue color="grey-400" size="md">
              {formatUSDValue(fillGasFeeUsd)}
            </FeeItemValue>
          </InnerRow>

          {swapFeeUsd && (
            <InnerRow>
              <FeeItemVector />
              <ToolTipWrapper>
                <Text size="md" color="grey-400">
                  Swap fee
                </Text>
                <Tooltip
                  title="Swap fee"
                  body="Fee for token swap on destination chain."
                  placement="bottom-start"
                >
                  <InfoIconWrapper>
                    <InfoIcon />
                  </InfoIconWrapper>
                </Tooltip>
              </ToolTipWrapper>
              <FeeItemValue color="grey-400" size="md">
                {formatUSDValue(swapFeeUsd)}
              </FeeItemValue>
            </InnerRow>
          )}
        </FeeItemWrapper>
      )}
    </FeeCard>
  );
}

const FeeCard = styled(SectionCard)``;

const FeeItemValue = styled(Text)`
  margin-left: auto;
`;

const FeeHeader = styled(SectionHeaderCollapsible)<{ collapsible?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  width: 100%;

  @media ${QUERIESV2.xs.andDown} {
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
  }
`;

const FeeItemVector = styled.span`
  position: relative;
  height: 14px;
  width: 14px;
  display: inline-block;
  border-left: 1px solid ${COLORS["grey-400"]};
  border-bottom: 1px solid ${COLORS["grey-400"]};
  border-radius: 0 0 0 7px;
  background: transparent;
  top: -6px;
`;

const FeeItemWrapper = styled.div`
  width: 100%;
  padding: var(--padding);
  border-top: 1px solid ${COLORS["base-dark-gray"]};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InnerRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
`;

const ToolTipWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
`;

const InfoIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 16px;
  width: 16px;
`;

const ChevronIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const ChevronIconStyled = styled(ChevronIcon)`
  transform: rotate(
    ${({ isExpanded }: { isExpanded: boolean }) =>
      isExpanded ? "180deg" : "0deg"}
  );
  transition: transform 0.2s ease-in-out;
`;
