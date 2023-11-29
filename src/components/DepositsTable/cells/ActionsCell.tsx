import { useCallback } from "react";
import styled from "@emotion/styled";

import { ReactComponent as ZapIcon } from "assets/zap.svg";
import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { Deposit } from "hooks/useDeposits";
import { COLORS } from "utils";

import { useIsProfitableAndDelayed } from "../hooks/useIsProfitableAndDelayed";

type Props = {
  deposit: Deposit;
  onClickSpeedUp?: (deposit: Deposit) => void;
};

export function ActionsCell({ deposit, onClickSpeedUp }: Props) {
  const { isDelayed, isProfitable } = useIsProfitableAndDelayed(deposit);

  const slowRelayInfo =
    isDelayed && isProfitable ? (
      <Tooltip
        tooltipId="delayed-info"
        title="Relayer running out of funds"
        maxWidth={320}
        placement="left"
        offset={60}
        icon={<SlowRelayInfoIconTooltip />}
        body={
          <Text size="sm" color="light-300">
            Due to low relay funds this transaction may take up to 3 hours to
            complete. Your full relayer fee will be refunded for the
            inconvenience.
          </Text>
        }
      >
        <SlowRelayInfoIcon />
      </Tooltip>
    ) : null;

  const handleClickSpeedUp = useCallback(() => {
    onClickSpeedUp?.(deposit);
  }, [deposit, onClickSpeedUp]);

  const speedUp =
    deposit.status === "pending" ? (
      isProfitable ? (
        <ZapIconOnHover id="speed-up-icon" onClick={handleClickSpeedUp} />
      ) : (
        <ZapIconPersistent onClick={handleClickSpeedUp} />
      )
    ) : null;

  return (
    <StyledActionsCell>
      <Blur />
      <ActionsContainer>
        {speedUp}
        {slowRelayInfo}
      </ActionsContainer>
    </StyledActionsCell>
  );
}

const StyledActionsCell = styled.td`
  display: flex;
  flex-direction: row;
  gap: 2px;

  right: 0;
  position: sticky;
  background-color: ${COLORS["black-800"]};
  height: 64px;
`;

const ActionsContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  svg {
    cursor: pointer;
    height: 24px;
    width: 24px;
  }
`;

const Blur = styled.div`
  width: 20px;
  height: 64px;
  background-color: ${COLORS["black-800"]};
  filter: blur(4px);
`;

const SlowRelayInfoIcon = styled(InfoIcon)`
  width: 24px;
  height: 24px;
  path {
    stroke: ${COLORS.yellow};
  }
`;

const SlowRelayInfoIconTooltip = styled(InfoIcon)`
  width: 16px;
  height: 16px;
  path {
    stroke: ${COLORS.yellow};
  }
`;

const ZapIconOnHover = styled(ZapIcon)`
  display: none;

  path {
    stroke: ${COLORS["grey-400"]};
  }
`;

const ZapIconPersistent = styled(ZapIcon)`
  path {
    stroke: ${COLORS.yellow};
  }
`;
