import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";

import { Deposit } from "hooks/useDeposits";
import { COLORS, getConfig } from "utils";

import { HeaderCells, ColumnKey } from "./HeadRow";
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

type Props = {
  deposit: Deposit & { isNewlyStreamed?: boolean; isUpdated?: boolean };
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

  // Hide unsupported or unknown token deposits
  if (!inputToken) {
    return null;
  }

  const handleRowClick = () => {
    history.push(`/transaction/${deposit.depositTxHash}`);
  };

  const rowAnimationProps = deposit.isNewlyStreamed
    ? {
        initial: { opacity: 0, scaleY: 0 },
        animate: { opacity: 1, scaleY: 1 },
        transition: {
          opacity: { duration: 0.5, ease: "easeOut" },
          scaleY: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        },
        layout: true,
      }
    : { layout: true };

  const overlayAnimationProps = deposit.isNewlyStreamed
    ? {
        initial: { opacity: 0.3 },
        animate: { opacity: 0 },
        transition: { duration: 1.2, ease: "easeOut" },
      }
    : deposit.isUpdated
      ? {
          initial: { opacity: 0.4 },
          animate: { opacity: 0 },
          transition: { duration: 1.0, ease: "easeOut" },
        }
      : {};

  return (
    <StyledRow onClick={handleRowClick} {...rowAnimationProps}>
      {deposit.isNewlyStreamed && (
        <ColorOverlay
          className="color-overlay"
          color="aqua"
          {...overlayAnimationProps}
        />
      )}
      {deposit.isUpdated && (
        <ColorOverlay
          className="color-overlay"
          color="yellow"
          {...overlayAnimationProps}
        />
      )}
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
      {isColumnDisabled(disabledColumns, "actions") ? null : (
        <ActionsCell deposit={deposit} onClickSpeedUp={onClickSpeedUp} />
      )}
    </StyledRow>
  );
}

const ColorOverlay = styled(motion.div)<{ color: "aqua" | "yellow" }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ color }) => COLORS[color]};
  pointer-events: none;
  z-index: 0;
`;

const StyledRow = styled(motion.tr)`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
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
