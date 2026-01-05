import styled from "@emotion/styled";
import { useState } from "react";
import { COLORS, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { ReactComponent as ChevronIcon } from "assets/icons/chevron-down.svg";

type TransactionFeeSectionProps = {
  bridgeFeeUsd: string | null;
  fillGasFee: string | null;
  fillGasFeeUsd: string | null;
  swapFeeUsd?: string | null;
  formatUSDValue: (value: string | null) => string;
};

export function TransactionFeeSection({
  bridgeFeeUsd,
  fillGasFee,
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
      <Row collapsible onClick={() => setIsExpanded(!isExpanded)}>
        <ToolTipWrapper>
          <Text size="md" color="grey-400">
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
      </Row>

      {isExpanded && (
        <>
          <Divider />
          <InnerWrapper>
            <VectorVertical />
            <InnerRow>
              <VectorHorizontal />
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
              <Text color="grey-400" size="md">
                {formatUSDValue(bridgeFeeUsd)}
              </Text>
            </InnerRow>

            <InnerRow>
              <VectorHorizontal />
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
              <Text color="grey-400" size="md">
                {fillGasFee} {formatUSDValue(fillGasFeeUsd)}
              </Text>
            </InnerRow>

            {swapFeeUsd && (
              <InnerRow>
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
                <Text color="grey-400" size="md">
                  {formatUSDValue(swapFeeUsd)}
                </Text>
              </InnerRow>
            )}
          </InnerWrapper>
        </>
      )}
    </FeeCard>
  );
}

const FeeCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: ${COLORS["black-800"]};
  border-radius: 16px;
  border: 1px solid ${COLORS["grey-600"]};
  width: 100%;
`;

const Row = styled.div<{ collapsible?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 6px;
  cursor: ${({ collapsible }) => (collapsible ? "pointer" : "default")};
  width: 100%;

  @media ${QUERIESV2.xs.andDown} {
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
  }
`;

const InnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
  padding-left: 32px;
  padding-top: 8px;
  position: relative;
  width: 100%;
`;

const InnerRow = styled(Row)`
  position: relative;
`;

const VectorVertical = styled.div`
  width: 14px;
  border-left: 2px ${COLORS["grey-500"]} solid;
  border-bottom: 2px ${COLORS["grey-500"]} solid;
  border-bottom-left-radius: 10px;
  position: absolute;
  top: 0;
  height: calc(100% - 8px);
  left: 8px;
`;

const VectorHorizontal = styled.div`
  position: absolute;
  top: 50%;
  left: -24px;
  width: 16px;
  height: 2px;
  background-color: ${COLORS["grey-500"]};
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

const Divider = styled.div`
  height: 1px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  background: ${COLORS["grey-600"]};
  width: 100%;
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
