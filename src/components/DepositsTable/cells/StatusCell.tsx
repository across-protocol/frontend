import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import { ReactComponent as CheckIcon } from "assets/check.svg";
import { ReactComponent as LoadingIcon } from "assets/loading.svg";
import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { Deposit } from "hooks/useDeposits";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";
import { formatSeconds, COLORS } from "utils";

import { BaseCell } from "./BaseCell";
import { useIsProfitableAndDelayed } from "../hooks/useIsProfitableAndDelayed";

type Props = {
  deposit: Deposit;
  width: number;
};

export function StatusCell({ deposit, width }: Props) {
  if (deposit.status === "pending") {
    return <PendingStatusCell deposit={deposit} width={width} />;
  }

  return <FilledStatusCell deposit={deposit} width={width} />;
}

function FilledStatusCell({ deposit, width }: Props) {
  const { elapsedSeconds } = useElapsedSeconds(
    deposit.depositTime,
    deposit.fillTime || 1
  );

  const doesFillTimeExist = deposit.fillTime !== undefined;

  return (
    <StyledFilledStatusCell width={width}>
      {doesFillTimeExist ? (
        <Text color="aqua">{formatSeconds(elapsedSeconds || 0)}</Text>
      ) : null}
      <FinalizedText color="aqua" size={doesFillTimeExist ? "sm" : "md"}>
        Finalized
        <CheckIcon />
      </FinalizedText>
    </StyledFilledStatusCell>
  );
}

function PendingStatusCell({ width, deposit }: Props) {
  const { isDelayed, isProfitable } = useIsProfitableAndDelayed(deposit);

  return (
    <StyledPendingStatusCell width={width}>
      <Text color={isProfitable && !isDelayed ? "light-200" : "yellow"}>
        {isDelayed ? "Delayed" : isProfitable ? "Processing..." : "Fee too low"}
      </Text>
      {isDelayed ? (
        <Tooltip
          tooltipId={`delayed-cell-info-${deposit.depositTxHash}`}
          placement="bottom"
          title="Relayer running out of funds"
          body={
            <Text size="sm" color="light-300">
              Due to low relay funds this transaction may take up to 3 hours to
              complete. Your full relayer fee will be refunded for the
              inconvenience.
            </Text>
          }
        >
          <StyledInfoIcon />
        </Tooltip>
      ) : isProfitable ? (
        <StyledLoadingIcon />
      ) : (
        <Tooltip
          tooltipId={`fee-too-low-${deposit.depositTxHash}`}
          placement="bottom"
          title="Relayer fee is too low"
          body={
            <FeeTooLowTooltipTextContainer>
              <Text size="sm" color="light-300">
                Click the button in the right end of the table to increase fee.
              </Text>
            </FeeTooLowTooltipTextContainer>
          }
        >
          <StyledInfoIcon />
        </Tooltip>
      )}
    </StyledPendingStatusCell>
  );
}

const StyledFilledStatusCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const FinalizedText = styled(Text)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const StyledPendingStatusCell = styled(BaseCell)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const StyledInfoIcon = styled(InfoIcon)`
  height: 16px;
  width: 16px;

  > path {
    stroke: ${COLORS.yellow};
  }
`;

const FeeTooLowTooltipTextContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const RotationKeyframes = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const StyledLoadingIcon = styled(LoadingIcon)`
  height: 16px;
  width: 16px;

  path {
    stroke: ${COLORS["light-200"]};
  }
  animation: ${RotationKeyframes} 2.5s linear infinite;
`;
