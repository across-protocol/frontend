import React, { FC } from "react";
import {
  TableWrapper,
  Wrapper,
  Title,
  EmptyRow,
  TableHeadRow,
  TableBody,
  TableRow,
} from "./Table.styles";
import { ICell, IRow } from "components/Table/Table";
interface TxTableIRow extends IRow {
  onClick?: () => void;
}

interface Props {
  rows: TxTableIRow[];
  headers: ICell[];
  title: string;
  scrollable: boolean;
}

const Table: FC<Props> = ({ rows, headers, title, scrollable = true }) => {
  return (
    <Wrapper>
      <Title>{title}</Title>
      <TableWrapper scrollable={scrollable}>
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

export default Table;
