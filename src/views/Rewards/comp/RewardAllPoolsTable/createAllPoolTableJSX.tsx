import { ICell, IRow } from "components/Table/Table";
import {
  CircleInfo,
  StyledWETHIcon,
  PoolCellValue,
} from "./RewardAllPoolsTable.styles";
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
          value: (
            <PoolCellValue>
              <StyledWETHIcon /> <div>ETH</div>
            </PoolCellValue>
          ),
        },
        {
          value: (
            <>
              <div>5 / 100</div>
              <div>ETH-LP</div>
            </>
          ),
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
    value: (
      <>
        Multiplier <CircleInfo />
      </>
    ),
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Reward APY",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: (
      <>
        Age of capital <CircleInfo />
      </>
    ),
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Rewards",
    cellClassName: "header-cell",
  },
];
