import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";

import { Deposit } from "hooks/useDeposits";
import { COLORS, getConfig } from "utils";

import { ColumnKey, HeaderCells } from "./HeadRow";
import { AssetCell } from "./cells/AssetCell";
import { AmountCell } from "./cells/AmountCell";
import { RouteCell } from "./cells/RouteCell";
import { AddressCell } from "./cells/AddressCell";
import { DateCell } from "./cells/DateCell";
import { StatusCell } from "./cells/StatusCell";
import { TxCell } from "./cells/TxCell";
import { NetFeeCell } from "./cells/NetFeeCell";
import { BridgeFeeCell } from "./cells/BridgeFeeCell";
import { RateCell } from "./cells/RateCell";
import { RewardsCell } from "./cells/RewardsCell";
import { ActionsCell } from "./cells/ActionsCell";
import { TimeAgoCell } from "./cells/TimeAgoCell";
import { useDepositRowAnimation } from "./hooks/useDepositRowAnimation";
import { AnimatedColorOverlay } from "./AnimatedColorOverlay";

type Props = {
  deposit: Deposit & { streamedAt?: number; updatedAt?: number };
  headerCells: HeaderCells;
  disabledColumns?: ColumnKey[];
  onClickSpeedUp?: (deposit: Deposit) => void;
};

const config = getConfig();

function isColumnDisabled(disabledColumns: ColumnKey[], column: ColumnKey) {
  return disabledColumns.includes(column);
}

export function DataRow({
  deposit,
  headerCells,
  disabledColumns = [],
  onClickSpeedUp,
}: Props) {
  const history = useHistory();
  const { rowAnimation, overlayProps } = useDepositRowAnimation(deposit);

  const swapToken = config.getTokenInfoByAddressSafe(
    deposit.sourceChainId,
    deposit.swapToken?.address || ""
  );
  const inputToken = config.getTokenInfoByAddressSafe(
    deposit.sourceChainId,
    deposit.token?.address || deposit.assetAddr
  );
  const outputToken = config.getTokenInfoByAddressSafe(
    deposit.destinationChainId,
    deposit.outputToken?.address || ""
  );

  if (!inputToken) {
    return null;
  }

  const handleRowClick = () => {
    history.push(`/transaction/${deposit.depositTxHash}`);
  };

  return (
    <StyledRow onClick={handleRowClick} {...rowAnimation}>
      <AnimatedColorOverlay overlay={overlayProps} />
      {isColumnDisabled(disabledColumns, "asset") ? null : (
        <AssetCell
          inputToken={inputToken}
          outputToken={outputToken}
          swapToken={swapToken}
          width={headerCells.asset.width}
        />
      )}
      {isColumnDisabled(disabledColumns, "amount") ? null : (
        <AmountCell
          deposit={deposit}
          token={swapToken || inputToken}
          width={headerCells.amount.width}
        />
      )}
      {isColumnDisabled(disabledColumns, "route") ? null : (
        <RouteCell deposit={deposit} width={headerCells.route.width} />
      )}
      {isColumnDisabled(disabledColumns, "address") ? null : (
        <AddressCell deposit={deposit} width={headerCells.address.width} />
      )}
      {isColumnDisabled(disabledColumns, "date") ? null : (
        <DateCell deposit={deposit} width={headerCells.date.width} />
      )}
      {isColumnDisabled(disabledColumns, "status") ? null : (
        <StatusCell deposit={deposit} width={headerCells.status.width} />
      )}
      {isColumnDisabled(disabledColumns, "transactions") ? null : (
        <TxCell deposit={deposit} width={headerCells.transactions.width} />
      )}
      {isColumnDisabled(disabledColumns, "bridgeFee") ? null : (
        <BridgeFeeCell deposit={deposit} width={headerCells.netFee.width} />
      )}
      {isColumnDisabled(disabledColumns, "netFee") ? null : (
        <NetFeeCell deposit={deposit} width={headerCells.netFee.width} />
      )}
      {isColumnDisabled(disabledColumns, "rewardsRate") ? null : (
        <RateCell deposit={deposit} width={headerCells.rewardsRate.width} />
      )}
      {isColumnDisabled(disabledColumns, "rewards") ? null : (
        <RewardsCell deposit={deposit} width={headerCells.rewards.width} />
      )}
      {isColumnDisabled(disabledColumns, "timeAgo") ? null : (
        <TimeAgoCell deposit={deposit} width={headerCells.timeAgo.width} />
      )}
      {isColumnDisabled(disabledColumns, "actions") ? null : (
        <ActionsCell deposit={deposit} onClickSpeedUp={onClickSpeedUp} />
      )}
    </StyledRow>
  );
}

const StyledRow = styled(motion.tr)`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0px 24px;
  border-width: 0px 1px 1px 1px;
  border-style: solid;
  border-color: ${COLORS["grey-600"]};
  cursor: pointer;
  overflow: hidden;
  transform-origin: top;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS["grey-500"]};
  }

  & > td,
  & > div:not(.color-overlay) {
    position: relative;
    z-index: 1;
  }
`;
