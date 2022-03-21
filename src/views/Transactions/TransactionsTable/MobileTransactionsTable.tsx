import { FC } from "react";
import {
  StyledTableWrapper,
  StyledMobileHeadRow,
  StyledBody,
  StyledMobileRow,
  MobileCell,
  MobileWrapper,
  Title,
} from "./TransactionsTable.styles";
import { ICell } from "components/Table/Table";
import { IMobileRow } from "./createMobileTransactionTableJSX";

interface Props {
  rows: IMobileRow[];
  headers: ICell[];
  title: string;
}

const MobileTransactionsTable: FC<Props> = ({ rows, headers, title }) => {
  return (
    <MobileWrapper>
      <Title>{title}</Title>
      <StyledTableWrapper>
        <StyledMobileHeadRow>
          {headers.map((cell, index) => {
            return (
              <MobileCell
                key={index}
                className={cell.cellClassName ?? ""}
                size={cell.size}
              >
                {cell.value}
              </MobileCell>
            );
          })}
        </StyledMobileHeadRow>
        <StyledBody>
          {rows.map((row, ridx) => {
            return (
              <StyledMobileRow key={ridx} onClick={row.onClick}>
                {row.cells.map((cell, cidx) => {
                  return (
                    <MobileCell
                      className={cell.cellClassName ?? ""}
                      key={cidx}
                      size={cell.size}
                    >
                      {cell.value}
                    </MobileCell>
                  );
                })}
              </StyledMobileRow>
            );
          })}
        </StyledBody>
      </StyledTableWrapper>
    </MobileWrapper>
  );
};

export default MobileTransactionsTable;
