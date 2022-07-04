import { getChainInfo, shortenAddress } from "utils";
import { ethers } from "ethers";
import { ICell, IRow } from "components/Table/Table";
import { Referral } from "views/Rewards/useRewardsView";
import {
  StyledETHIcon,
  PoolCellValue,
  ArrowUpRight,
  GrayText,
  LinkDiv,
  StyledUniLogo,
  StyledUSDCLogo,
} from "./RewardTables.styles";

export default function createMyReferralsTableJSX(
  referrals: Referral[],
  isConnected: boolean
) {
  if (!isConnected) return DISCONNECTED_ROWS;
  const rows = formatMyReferralsRows(referrals);
  return rows;
}

function determineIcon(symbol: string) {
  switch (symbol) {
    case "USDC":
      return <StyledUSDCLogo />;
    case "UNI":
      return <StyledUniLogo />;
    default:
      return <StyledETHIcon />;
  }
}

// Will take a TransactionsArg
function formatMyReferralsRows(referrals: Referral[]): IRow[] {
  const fr = referrals.map((r) => {
    return {
      cells: [
        {
          value: (
            <PoolCellValue>
              {determineIcon(r.symbol)} <div>{r.symbol}</div>
            </PoolCellValue>
          ),
        },
        {
          value: (
            <>
              <div>{getChainInfo(r.sourceChainId).name}</div>
              <GrayText>
                &rarr; {getChainInfo(r.destinationChainId).name}
              </GrayText>
            </>
          ),
        },
        {
          value: shortenAddress(r.depositorAddr, "...", 4),
        },
        {
          value: r.realizedLpFeeUsd.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 4,
          }),
        },
        {
          value: (
            <>
              <div>{`${r.referralRate * 100}%`}</div>
            </>
          ),
        },
        {
          value: `${Number(ethers.utils.formatUnits(r.acxRewards, 18)).toFixed(
            4
          )} ACX`,
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
    };
  });
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

const DISCONNECTED_ROWS: IRow[] = [
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
            <StyledUniLogo /> <div>UNI</div>
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
