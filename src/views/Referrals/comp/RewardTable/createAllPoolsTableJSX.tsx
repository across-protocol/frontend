import { ICell, IRow } from "components/Table/Table.d";
import {
  CircleInfo,
  StyledETHIcon,
  PoolCellValue,
  MultiplierCellValue,
  MutliplierValue,
  StakeButton,
  StyledProgressBar,
  ArrowUpRight,
} from "./RewardTables.styles";

export default function createAllPoolsTableJSX() {
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
              <StyledETHIcon /> <div>UNI</div>
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
    value: "Pool",
  },
  {
    value: "Staked LP Tokens",
  },
  {
    value: (
      <>
        Multiplier <CircleInfo />
      </>
    ),
  },
  {
    value: "Reward APY",
  },
  {
    value: (
      <>
        Age of capital <CircleInfo />
      </>
    ),
  },
  {
    value: "Rewards",
  },
  {
    value: " ",
  },
];
