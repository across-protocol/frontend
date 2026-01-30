import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import { ReactComponent as LoadingIcon } from "assets/icons/loading.svg";
import { COLORS } from "utils/constants";
import {
  ColumnKey,
  ColumnTooltipRecord,
  headerCells,
  HeadRow,
} from "./HeadRow";
import { DataRow } from "./DataRow";
import { Deposit } from "hooks/useDeposits";

export type TransfersTableProps = {
  disabledColumns?: ColumnKey[];
  onClickSpeedUp?: (deposit: Deposit) => void;
  deposits: Deposit[];
  filterKey?: string;
  tooltips?: ColumnTooltipRecord;
  isLoading?: boolean;
};

export function TransfersTable({
  disabledColumns = [],
  deposits,
  onClickSpeedUp,
  filterKey = "",
  tooltips,
  isLoading = false,
}: TransfersTableProps) {
  return (
    <Wrapper>
      {isLoading && (
        <LoadingOverlay>
          <StyledLoadingIcon />
        </LoadingOverlay>
      )}
      <StyledTable $isLoading={isLoading}>
        <HeadRow disabledColumns={disabledColumns} columnTooltips={tooltips} />
        <tbody>
          {deposits.map((deposit) => (
            <DataRow
              disabledColumns={disabledColumns}
              headerCells={headerCells}
              key={`${filterKey}${deposit.depositTxHash}-${deposit.depositId}`}
              deposit={deposit}
              onClickSpeedUp={onClickSpeedUp}
            />
          ))}
        </tbody>
      </StyledTable>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
`;

const StyledTable = styled.table<{ $isLoading: boolean }>`
  white-space: nowrap;
  table-layout: fixed;
  opacity: ${({ $isLoading }) => ($isLoading ? 0.5 : 1)};
  transition: opacity 0.2s ease;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
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
  width: 32px;
  height: 32px;

  path {
    stroke: ${COLORS["light-200"]};
  }

  animation: ${RotationKeyframes} 1.5s linear infinite;
`;
