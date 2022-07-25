import { FC } from "react";
import {
  StyledTableWrapper,
  StyledHeadRow,
  StyledBody,
  StyledRow,
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

          <StyledTableWrapper>
            <StyledHeadRow>
              {headers.map((cell, index) => {
                return (
                  <HeadCell key={index} className={cell.cellClassName ?? ""}>
                    {cell.value}
                  </HeadCell>
                );
              })}
            </StyledHeadRow>
            <StyledBody>
              {rows.length
                ? rows.map((row, ridx) => {
                    return (
                      <StyledRow key={ridx}>
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
                      </StyledRow>
                    );
                  })
                : null}
            </StyledBody>
          </StyledTableWrapper>
        </>
      ) : null}
    </Wrapper>
  );
};

export default TransactionsTable;
