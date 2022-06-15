import { ICell, IRow } from "components/Table/Table";

/* 
export interface ICell {
  // if undefined, defaults to "sm"
  size?: CellSize;
  value: string | ReactElement;
  cellClassName?: string;
}

export interface IRow {
  cells: ICell[];
}
*/

export default function createAllPoolTableJSX() {
  const rows = formatAllPoolsRows();
  return rows;
}

// Will take a TransactionsArg
function formatAllPoolsRows(): IRow[] {
  const fr = [
    {
      cells: [
        {
          value: "test",
        },
        {
          value: "two",
        },
        {
          value: "three",
        },
      ],
    },
  ];
  return fr;
}

export const headers: ICell[] = [
  {
    size: "sm",
    value: "Deposit time",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Status",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Filled %",
    cellClassName: "header-cell",
  },
  // {
  //   size: "xs",
  //   value: "Source",
  //   cellClassName: "header-cell",
  // },
  // {
  //   size: "xs",
  //   value: "Destination",
  //   cellClassName: "header-cell",
  // },
  // {
  //   size: "xs",
  //   value: "Asset",
  //   cellClassName: "header-cell",
  // },
  // {
  //   size: "xs",
  //   value: "Amount",
  //   cellClassName: "header-cell",
  // },
  // {
  //   size: "xs",
  //   value: "Deposit tx",
  //   cellClassName: "header-cell",
  // },
  // {
  //   size: "md",
  //   value: "Fill tx(s)",
  //   cellClassName: "header-cell",
  // },
];
