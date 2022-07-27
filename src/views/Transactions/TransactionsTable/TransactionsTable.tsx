import { FC } from "react";
import {
  TableWrapper,
  TableHeadRow,
  TableBody,
  TableRow,
  TableCell,
  Wrapper,
  Title,
  HeadCell,
  EmptyRow,
} from "./TransactionsTable.styles";
import { ICell, IRow } from "components/Table/Table.d";

interface TxTableIRow extends IRow {
  onClick?: () => void;
}

interface Props {
  rows: TxTableIRow[];
  headers: ICell[];
  title: string;
}

const TransactionsTable: FC<Props> = ({ rows, headers, title }) => {
  return (
    <Wrapper>
      {rows.length ? (
        <>
          <Title>{title}</Title>

          <TableWrapper>
            <TableHeadRow>
              {headers.map((cell, index) => {
                return <HeadCell key={index}>{cell.value}</HeadCell>;
              })}
            </TableHeadRow>
            <TableBody>
              {rows.length ? (
                rows.map((row, ridx) => {
                  return (
                    <TableRow key={ridx}>
                      {row.cells.map((cell, cidx) => {
                        return <TableCell key={cidx}>{cell.value}</TableCell>;
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <EmptyRow>No transactions found.</EmptyRow>
              )}
            </TableBody>
          </TableWrapper>
        </>
      ) : null}
    </Wrapper>
  );
};

export default TransactionsTable;
