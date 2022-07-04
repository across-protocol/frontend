import { ICell, IRow } from "components/Table/Table";
import {
  CircleInfo,
  StyledETHIcon,
  PoolCellValue,
  MultiplierCellValue,
  MutliplierValue,
  StakeButton,
  StyledProgressBar,
  ArrowUpRight,
  StyledUniLogo,
} from "./RewardTables.styles";

export default function createMyPoolsTableJSX() {
  const rows = formatMyPoolsRows();
  return rows;
}

// Will take a TransactionsArg
function formatMyPoolsRows(): IRow[] {
  const fr = [
    {
      cells: [
        {
          value: (
            <PoolCellValue>
              <StyledETHIcon /> <div>ETH</div>
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
              <StyledProgressBar className="pool-progress-bar" percent={97} />{" "}
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
              <div>
                Stake <ArrowUpRight />
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
              <StyledUniLogo /> <div>UNI</div>
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
              <StyledProgressBar className="pool-progress-bar" percent={50} />{" "}
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
