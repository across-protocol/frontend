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
          value: "one",
        },
        {
          value: "two",
        },
        {
          value: "three",
        },
        {
          value: "four",
        },
        {
          value: "five",
        },
        {
          value: "six",
        },
      ],
    },
  ];
  return fr;
}

export const headers: ICell[] = [
  {
    size: "sm",
    value: "Pool",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Staked LP Tokens",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Multiplier",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Reward APY",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Age of capital",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Rewards",
    cellClassName: "header-cell",
  },
];
