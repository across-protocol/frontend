import styled from "@emotion/styled";

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
  deposit: Deposit;
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
  const token = config.getTokenInfoByAddressSafe(
    deposit.sourceChainId,
    deposit.assetAddr
  );

  // Hide unsupported or unknown token deposits
  if (!token) {
    return null;
  }

  return (
    <StyledRow>
      {isColumnDisabled(disabledColumns, "asset") ? null : (
        <AssetCell token={token} width={headerCells.asset.width} />
      )}
      {isColumnDisabled(disabledColumns, "amount") ? null : (
        <AmountCell
          deposit={deposit}
          token={token}
          width={headerCells.amount.width}
        />
      )}
      {isColumnDisabled(disabledColumns, "route") ? null : (
        <RouteCell
          deposit={deposit}
          token={token}
          width={headerCells.route.width}
        />
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

const StyledRow = styled.tr`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 0px 24px;
  border-width: 0px 1px 1px 1px;
  border-style: solid;
  border-color: ${COLORS["grey-600"]};

  :hover {
    #speed-up-icon {
      display: block;
    }
  }
`;
