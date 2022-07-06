import ReactDOMServer from "react-dom/server";
import { DateTime } from "luxon";
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
  StyledUNILogo,
  StyledUSDCLogo,
  ReferralDiv,
} from "./RewardTables.styles";
import { ReactComponent as UserIcon } from "assets/user.svg";
import { ReactComponent as ArrowUserIcon } from "assets/corner-down-right.svg";
import { ReactComponent as UsersIcon } from "assets/users.svg";

import RewardTooltip from "../RewardTooltip";
export default function createMyReferralsTableJSX(
  referrals: Referral[],
  isConnected: boolean,
  account: string
) {
  if (!isConnected) return DISCONNECTED_ROWS;
  const rows = formatMyReferralsRows(referrals, account);
  return rows;
}

function determineIcon(symbol: string) {
  switch (symbol) {
    case "USDC":
      return <StyledUSDCLogo />;
    case "UNI":
      return <StyledUNILogo />;
    default:
      return <StyledETHIcon />;
  }
}

function determineReferralIcon(
  account: string,
  depositAddr: string,
  referralAddr: string
) {
  if (account === referralAddr) {
    return (
      <ReferralDiv
        data-html={true}
        data-tip={ReactDOMServer.renderToString(
          <RewardTooltip
            icon="users"
            title="Referral transfer"
            body="This transfer was made by someone using your unique referral link."
          />
        )}
        data-for="rewards"
        data-place="right"
      >
        <UsersIcon />
      </ReferralDiv>
    );
  }
  if (account === depositAddr) {
    return (
      <ReferralDiv
        data-html={true}
        data-tip={ReactDOMServer.renderToString(
          <RewardTooltip
            icon="user"
            title="Referree transfer"
            body="This transfer was made from your wallet address using an external referral link."
          />
        )}
        data-for="rewards"
        data-place="right"
      >
        <ArrowUserIcon />
        <UserIcon />
      </ReferralDiv>
    );
  }

  return null;
}

// Will take a TransactionsArg
function formatMyReferralsRows(referrals: Referral[], account: string): IRow[] {
  const fr = referrals.map((r, i) => {
    return {
      cells: [
        {
          value: (
            <PoolCellValue>
              {determineIcon(r.symbol)} <div>{r.symbol}</div>{" "}
              {determineReferralIcon(
                account,
                r.depositorAddr,
                r.referralAddress
              )}
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
          value: (
            <>
              <div>
                {DateTime.fromISO(r.depositDate).toFormat("dd LLL yyyy")}
              </div>
              <GrayText>
                {DateTime.fromISO(r.depositDate).toFormat("t")}
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
              <a
                href={getChainInfo(r.sourceChainId).constructExplorerLink(
                  r.depositTxHash
                )}
                target="_blank"
                rel="noreferrer"
              >
                <ArrowUpRight />
              </a>
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
    value: "Date",
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
        value: (
          <>
            <div>30 Jun, 2022</div>
            <GrayText>12:41 PM</GrayText>
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
            <StyledUNILogo /> <div>UNI</div>
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
        value: (
          <>
            <div>30 Jun, 2022</div>
            <GrayText>1:41 PM</GrayText>
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
