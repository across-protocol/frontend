import React, { FC } from "react";
import {
  TableWrapper,
  Wrapper,
  EmptyRow,
  TableHeadRow,
  TableBody,
  TableRow,
} from "./RewardTables.styles";
import { ICell, IRow } from "components/Table/Table";
import SectionWrapper from "components/SectionTitleWrapperV2";
interface TxTableIRow extends IRow {
  onClick?: () => void;
}

interface Props {
  rows: TxTableIRow[];
  headers: ICell[];
  title: string;
  scrollable: boolean;
}

const RewardMyPoolsTable: FC<Props> = ({
  rows,
  headers,
  title,
  scrollable = true,
}) => {
  return (
    <Wrapper data-cy="rewards-table">
      <SectionWrapper title={title}>
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
      </SectionWrapper>
    </Wrapper>
  );
};

export default RewardMyPoolsTable;
