import { FC } from "react";
import {
  TableWrapper,
  TableHeadRow,
  StyledBody,
  TableRow,
  TableCell,
  Wrapper,
  Title,
  HeadCell,
} from "./TransactionsTable.styles";
import { ICell, IRow } from "components/Table/Table";
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
                return (
                  <HeadCell key={index} className={cell.cellClassName ?? ""}>
                    {cell.value}
                  </HeadCell>
                );
              })}
            </TableHeadRow>
            <StyledBody>
              {rows.length
                ? rows.map((row, ridx) => {
                    return (
                      <TableRow key={ridx}>
                        {row.cells.map((cell, cidx) => {
                          return (
                            <TableCell
                              className={cell.cellClassName ?? ""}
                              key={cidx}
                            >
                              {cell.value}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                : null}
            </StyledBody>
          </TableWrapper>
        </>
      ) : null}
    </Wrapper>
  );
};

export default TransactionsTable;
