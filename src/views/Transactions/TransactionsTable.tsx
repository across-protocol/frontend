import { FC } from "react";
import { ICell, IRow } from "components/Table/Table";
import {
  StyledTableWrapper,
  StyledHeadRow,
  StyledBody,
  StyledRow,
  StyledCell,
  Wrapper,
  Title,
} from "./TransactionTable.styles";

interface Props {
  rows: IRow[];
  headerCells: ICell[];
}

const TransactionsTable: FC<Props> = ({ rows, headerCells }) => {
  return (
    <Wrapper>
      <Title>History</Title>
      <StyledTableWrapper>
        <StyledHeadRow>
          {headerCells.map((cell, index) => {
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
