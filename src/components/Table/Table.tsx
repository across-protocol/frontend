import React, { FC, ReactElement } from "react";
import { TableWrapper, Row, Body, HeadRow, Cell, Title } from "./Table.styles";

export interface TableProps {
  headerCells: ICell[];
  rows: IRow[];
  // Optional Title component
  title?: string | ReactElement;
  className?: string;
}

export type CellSize = "xs" | "sm" | "md" | "lg";

export interface ICell {
  // if undefined, defaults to "sm"
  size?: CellSize;
  value: string | ReactElement;
  cellClassName?: string;
}

export interface IRow {
  cells: ICell[];
}

const Table: FC<TableProps> = ({ headerCells, rows, title }) => {
  return (
    <TableWrapper>
      {title && typeof title === "string" ? (
        <Title>{title}</Title>
      ) : title ? (
        title
      ) : null}
      <HeadRow>
        {headerCells.map((cell, index) => {
          return (
            <Cell
              key={index}
              className={cell.cellClassName ?? ""}
              size={cell.size}
            >
              {cell.value}
            </Cell>
          );
        })}
      </HeadRow>
      <Body>
        {rows.map((row, ridx) => {
          return (
            <Row key={ridx}>
              {row.cells.map((cell, cidx) => {
                return (
                  <Cell
                    className={cell.cellClassName ?? ""}
                    key={cidx}
                    size={cell.size}
                  >
                    {cell.value}
                  </Cell>
                );
              })}
            </Row>
          );
        })}
      </Body>
    </TableWrapper>
  );
};

export default Table;
