import { FC } from "react";
import {
  StyledTableWrapper,
  StyledHeadRow,
  StyledBody,
  StyledRow,
  StyledCell,
  Wrapper,
  Title,
  EmptyRow,
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
          {rows.length ? (
            rows.map((row, ridx) => {
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
            })
          ) : (
            <EmptyRow>You have no referral transfers yet</EmptyRow>
          )}
        </StyledBody>
      </StyledTableWrapper>
    </Wrapper>
  );
};

export default RewardMyPoolsTable;
