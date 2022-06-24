import { ICell, IRow } from "components/Table/Table";
import {
  CircleInfo,
  StyledWETHIcon,
  PoolCellValue,
  MultiplierCellValue,
  MutliplierValue,
  StakeButton,
  StyledProgressBar,
  ArrowUpRight,
} from "./RewardTables.styles";

export default function createMyReferralsTableJSX() {
  const rows = formatMyReferralsRows();
  return rows;
}

// Will take a TransactionsArg
function formatMyReferralsRows(): IRow[] {
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
              <div>0 / 0</div>
              <div>ETH-LP</div>
            </>
          ),
        },
        {
          value: (
            <MultiplierCellValue>
              <StyledProgressBar className="pool-progress-bar" percent={0} />{" "}
              <MutliplierValue>1.0x </MutliplierValue>
            </MultiplierCellValue>
          ),
        },
        {
          value: (
            <>
              <div>1.2%</div>
              <div>Base 1.2%</div>
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
              <div>
                Add <ArrowUpRight />
              </div>
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
              <StyledProgressBar className="pool-progress-bar" percent={0} />{" "}
              <MutliplierValue>1.0x </MutliplierValue>
            </MultiplierCellValue>
          ),
        },
        {
          value: (
            <>
              <div>2.00%</div>
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
              <div>Add</div>
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
