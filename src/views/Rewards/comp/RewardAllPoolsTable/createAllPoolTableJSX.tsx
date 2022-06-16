import { ICell, IRow } from "components/Table/Table";
import {
  CircleInfo,
  StyledWETHIcon,
  PoolCellValue,
  MultiplierCellValue,
  MutliplierValue,
  StakeButton,
} from "./RewardAllPoolsTable.styles";
import ProgressBar from "components/ProgressBar";

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
          value: (
            <MultiplierCellValue>
              <ProgressBar percent={100} />{" "}
              <MutliplierValue>2.00x </MutliplierValue>
            </MultiplierCellValue>
          ),
        },
        {
          value: (
            <>
              <div>2.78%</div>
              <div>Base 1.39%</div>
            </>
          ),
        },
        {
          value: "50 days",
        },
        {
          value: "414.14 ACX",
        },
        {
          value: (
            <StakeButton>
              <div>Stake</div>
            </StakeButton>
          ),
        },
      ],
    },
    {
      cells: [
        {
          value: (
            <PoolCellValue>
              <StyledWETHIcon /> <div>UNI</div>
            </PoolCellValue>
          ),
        },
        {
          value: (
            <>
              <div>0 / 132.23</div>
              <div>UNI-LP</div>
            </>
          ),
        },
        {
          value: (
            <MultiplierCellValue>
              <ProgressBar percent={50} />{" "}
              <MutliplierValue>1.5x </MutliplierValue>
            </MultiplierCellValue>
          ),
        },
        {
          value: (
            <>
              <div>3.00%</div>
              <div>Base 2.00%</div>
            </>
          ),
        },
        {
          value: "25 days",
        },
        {
          value: "235.66 ACX",
        },
        {
          value: (
            <StakeButton>
              <div>Stake</div>
            </StakeButton>
          ),
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
  {
    size: "xs",
    value: " ",
    cellClassName: "header-cell",
  },
];
