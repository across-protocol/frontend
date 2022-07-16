import React, { FC } from "react";
import {
  TableWrapper,
  Wrapper,
  Title,
  EmptyRow,
  TableHeadRow,
  TableBody,
  TableRow,
} from "./RewardTables.styles";
import { ICell, IRow } from "components/Table/Table";
interface TxTableIRow extends IRow {
  onClick?: () => void;
}

interface Props {
  rows: TxTableIRow[];
  headers: ICell[];
  title: string;
}

const RewardMyPoolsTable: FC<Props> = ({ rows, headers, title }) => {
  return (
    <Wrapper>
      <Title>{title}</Title>
      <TableWrapper scrollable={rows.length > 0}>
        <TableHeadRow>
          {headers.map((cell, idx) =>
            React.cloneElement(cell.value as any, { key: idx })
          )}
        </TableHeadRow>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, ridx) => {
              return (
                <TableRow key={ridx}>
                  {row.cells.map((cell, idx) =>
                    React.cloneElement(cell.value as any, { key: idx })
                  )}
                  {(row as any).explorerLink}
                </TableRow>
              );
            })
          ) : (
            <EmptyRow>You have no referral transfers yet</EmptyRow>
          )}
        </TableBody>
      </TableWrapper>
    </Wrapper>
  );
};

export default RewardMyPoolsTable;
