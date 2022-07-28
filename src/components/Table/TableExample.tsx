import React, { FC } from "react";
import {
  BaseTableWrapper,
  BaseWrapper,
  BaseTitle,
  BaseEmptyRow,
  BaseTableHeadRow,
  BaseTableBody,
  BaseTableRow,
} from "./Table.styles";
import { ICell, IRow } from "./Table.d";

interface Props {
  rows: IRow[];
  headers: ICell[];
  title: string;
  scrollable: boolean;
  emptyMsg: string;
}

const Table: FC<Props> = ({
  rows,
  headers,
  title,
  scrollable = true,
  emptyMsg,
}) => {
  return (
    <BaseWrapper>
      <BaseTitle>{title}</BaseTitle>
      <BaseTableWrapper scrollable={scrollable}>
        <BaseTableHeadRow>
          {headers.map((cell, idx) =>
            React.cloneElement(cell.value as any, { key: idx })
          )}
        </BaseTableHeadRow>
        <BaseTableBody>
          {rows.length > 0 ? (
            rows.map((row, ridx) => {
              return (
                <BaseTableRow key={ridx}>
                  {row.cells.map((cell, idx) =>
                    React.cloneElement(cell.value as any, { key: idx })
                  )}
                  {(row as any).explorerLink}
                </BaseTableRow>
              );
            })
          ) : (
            <BaseEmptyRow>{emptyMsg}</BaseEmptyRow>
          )}
        </BaseTableBody>
      </BaseTableWrapper>
    </BaseWrapper>
  );
};

export default Table;
