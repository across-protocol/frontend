import { FC, useState, useEffect } from "react";
import {
  StyledTableWrapper,
  StyledHeadRow,
  StyledBody,
  StyledRow,
  StyledCell,
  Wrapper,
  Title,
} from "./TransactionTable.styles";
import formatTransactions from "./formatTransactions";
import { ICell, IRow } from "components/Table/Table";

interface Props {}

const TransactionsTable: FC<Props> = () => {
  const [rows, setRows] = useState<IRow[]>([]);
  const [headers, setHeaders] = useState<ICell[]>([]);
  // Only run this when transactions changes.
  // Stubbed in should only need to run once.
  useEffect(() => {
    const { rows: r, headers: h } = formatTransactions();
    setHeaders(h);
    setRows(r);
  }, []);

  return (
    <Wrapper>
      <Title>History</Title>
      <StyledTableWrapper>
        <StyledHeadRow>
          {headers.map((cell, index) => {
            return (
              <StyledCell
                key={index}
                className={cell.cellClassName ?? ""}
                size={cell.size}
              >
                {cell.value}
              </StyledCell>
            );
          })}
        </StyledHeadRow>
        <StyledBody>
          {rows.map((row, ridx) => {
            return (
              <StyledRow key={ridx}>
                {row.cells.map((cell, cidx) => {
                  return (
                    <StyledCell
                      className={cell.cellClassName ?? ""}
                      key={cidx}
                      size={cell.size}
                    >
                      {cell.value}
                    </StyledCell>
                  );
                })}
              </StyledRow>
            );
          })}
        </StyledBody>
      </StyledTableWrapper>
    </Wrapper>
  );
};

export default TransactionsTable;
