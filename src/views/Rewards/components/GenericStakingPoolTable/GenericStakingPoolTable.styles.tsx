import styled from "@emotion/styled";
import ProgressBar from "components/ProgressBar";
import { BaseHeadCell } from "components/Table";
import { Link } from "react-router-dom";
import { ReactComponent as II } from "assets/icons/info-16.svg";
import { ReactComponent as ConnectorVector } from "assets/connectors.svg";
import { QUERIESV2 } from "utils";

const Cell = styled(BaseHeadCell)<{ length: number }>`
  flex: 0 0 ${({ length }) => length}px;
`;

export const InfoIcon = styled(II)`
  cursor: pointer;
`;

export const HeaderCell = styled(Cell)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
`;

export const StyledConnectorVector = styled(ConnectorVector)``;

export const RowCell = styled(Cell)`
  padding: 24px;
  background: transparent;
  border-top: 1px solid #3e4047;
`;

const BaseCell = styled.div`
  margin-left: -8px;
  width: calc(100%);

  @media ${QUERIESV2.sm.andDown} {
    margin-left: -8px;
  }
`;

export const PoolCell = styled(BaseCell)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 24px;
`;

export const PoolTextStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
`;

export const ExternalStackedCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
`;

export const StackedCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
`;

export const HorizontalStackedCell = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 0px;
`;

export const RewardCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 6px;
`;

export const RewardConnectorTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
`;

export const StakedTokenCellInner = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 0;
`;

export const MultiplierCell = styled(BaseCell)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;
  width: 100%;
  margin-left: -6px;
`;

export const ButtonCell = styled.div`
  position: sticky;
  right: 0;
  align-self: stretch;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  padding: 20px 16px;

  background: #2d2e33;
  border-top: 1px solid #3e4047;
`;

export const StakeButton = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px ${16 / 16}rem;

  border: 1px solid #6cf9d8;
  border-radius: 20px;

  height: ${40 / 16}rem;

  a,
  button {
    color: #6cf9d8;
    font-weight: 500;
    text-decoration: none;
  }
`;

interface IStyledProgressBar {
  active: boolean;
}
export const StyledProgressBar = styled(ProgressBar)<IStyledProgressBar>`
  &.pool-progress-bar {
    padding-right: 4px;
    max-width: 80px;
    border-color: ${({ active }) => (active ? "#e0f3ff" : "#4c4e57")};
    & > div {
      background-color: ${({ active }) => (active ? "#e0f3ff" : "#4c4e57")};
    }
  }
`;

export const ExternalLinkButton = styled(Link)`
  border: 1px solid #4c4e57;
  border-radius: 32px;
  height: ${40 / 16}rem;
  width: ${40 / 16}rem;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;
`;

export const LogoWrapper = styled.div`
  height: fit-content;
  width: ${32 / 16}rem;
  height: ${32 / 16}rem;
  display: flex;
  justify-content: center;
  & svg {
    width: ${32 / 16}rem;
    height: ${32 / 16}rem;
  }
`;

export const ExternalTextCell = styled(BaseCell)`
  margin-left: -6px;
`;
