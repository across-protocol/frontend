import { ICell, IRow } from "components/Table/Table";
import {
  StyledWETHIcon,
  PoolCellValue,
  ArrowUpRight,
  GrayText,
  LinkDiv,
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
              <div>Ethereum Mainnet</div>
              <GrayText>&rarr; Optimism</GrayText>
            </>
          ),
        },
        {
          value: "0x123...4567",
        },
        { value: "$1234.56" },
        {
          value: (
            <>
              <div>80%</div>
              <GrayText>12.24 ACX</GrayText>
            </>
          ),
        },
        {
          value: "414.14 ACX",
        },
        {
          value: (
            <LinkDiv>
              <div>
                <ArrowUpRight />
              </div>
            </LinkDiv>
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
              <div>Ethereum Mainnet</div>
              <GrayText>&rarr; Optimism</GrayText>
            </>
          ),
        },
        {
          value: "0x123...4567",
        },
        { value: "$1234.56" },
        {
          value: (
            <>
              <div>80%</div>
              <GrayText>12.24 ACX</GrayText>
            </>
          ),
        },
        {
          value: "414.14 ACX",
        },
        {
          value: (
            <LinkDiv>
              <div>
                <ArrowUpRight />
              </div>
            </LinkDiv>
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
    value: "Asset",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: <>From &rarr; To</>,
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Address",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Bridge fee",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Referral rate",
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
