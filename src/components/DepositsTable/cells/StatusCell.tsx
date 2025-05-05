import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import { ReactComponent as CheckIcon } from "assets/icons/check.svg";
import { ReactComponent as LoadingIcon } from "assets/icons/loading.svg";
import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { Deposit } from "hooks/useDeposits";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";
import { formatSeconds, COLORS } from "utils";

import { BaseCell } from "./BaseCell";
import { useDepositStatus } from "../hooks/useDepositStatus";

type Props = {
  deposit: Deposit;
  width: number;
};

export function StatusCell({ deposit, width }: Props) {
  if (deposit.status === "filled") {
    return <FilledStatusCell deposit={deposit} width={width} />;
  }

  if (deposit.status === "refunded") {
    return <RefundedStatusCell deposit={deposit} width={width} />;
  }

  if (deposit.status === "slowFillRequested") {
    return <SlowFillRequestedStatusCell deposit={deposit} width={width} />;
  }

  return <PendingStatusCell deposit={deposit} width={width} />;
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
        Filled
        <CheckIcon />
      </FinalizedText>
    </StyledFilledStatusCell>
  );
}

function PendingStatusCell({ width, deposit }: Props) {
  const { isDelayed, isProfitable, isExpired } = useDepositStatus(deposit);

  return (
    <StyledPendingStatusCell width={width}>
      <Text
        color={
          (isProfitable && !isDelayed) || isExpired ? "light-200" : "yellow"
        }
      >
        {isExpired
          ? "Expired"
          : isDelayed
            ? "Delayed"
            : isProfitable
              ? "Processing..."
              : "Fee too low"}
      </Text>
      {!isExpired &&
        (isDelayed ? (
          <Tooltip
            tooltipId={`delayed-cell-info-${deposit.depositTxHash}`}
            placement="bottom"
            title="Insufficient relayer funds"
            body={
              <Text size="sm" color="light-300">
                Relayer funds are insufficient to complete this transfer
                immediately. The transfer will be settled directly by Across and
                may take up to 3 hours. No relayer fee will be charged on this
                transfer.
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
                  Click the button in the right end of the table to increase
                  fee.
                </Text>
              </FeeTooLowTooltipTextContainer>
            }
          >
            <StyledInfoIcon />
          </Tooltip>
        ))}
    </StyledPendingStatusCell>
  );
}

function RefundedStatusCell({ width }: Props) {
  return (
    <StyledPendingStatusCell width={width}>
      <Text color={"light-200"}>Refunded</Text>
    </StyledPendingStatusCell>
  );
}

function SlowFillRequestedStatusCell({ width }: Props) {
  return (
    <StyledPendingStatusCell width={width}>
      <Text color={"light-200"}>Slow Fill Requested</Text>
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
