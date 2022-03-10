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
import { ICell, IRow } from "components/Table/Table";

interface Props {
  rows: IRow[];
  headers: ICell[];
  title: string;
}

const TransactionsTable: FC<Props> = ({ rows, headers, title }) => {
  return (
    <Wrapper>
      <Title>{title}</Title>
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
