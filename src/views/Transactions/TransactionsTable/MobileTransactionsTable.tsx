import { FC } from "react";
import {
  StyledTableWrapper,
  StyledMobileHeadRow,
  StyledBody,
  StyledMobileRow,
  StyledCell,
  MobileWrapper,
  Title,
} from "./TransactionsTable.styles";
import { ICell, IRow } from "components/Table/Table";
interface MobileTxTableIRow extends IRow {
  onClick?: () => void;
}

interface Props {
  rows: MobileTxTableIRow[];
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
              <StyledCell
                key={index}
                className={cell.cellClassName ?? ""}
                size={cell.size}
              >
                {cell.value}
              </StyledCell>
            );
          })}
        </StyledMobileHeadRow>
        <StyledBody>
          {rows.map((row, ridx) => {
            return (
              <StyledMobileRow key={ridx} onClick={row.onClick}>
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
              </StyledMobileRow>
            );
          })}
        </StyledBody>
      </StyledTableWrapper>
    </MobileWrapper>
  );
};

export default MobileTransactionsTable;
