import ReactDOMServer from "react-dom/server";
import { DateTime } from "luxon";
import { getChainInfo, shortenAddress } from "utils";
import { ethers } from "ethers";
import { ICell, IRow } from "components/Table/Table";
import { Referral } from "hooks/useReferrals";
import {
  StyledETHIcon,
  GrayText,
  StyledUNILogo,
  StyledUSDCLogo,
  ReferralDiv,
  StyledWETHLogo,
  StyledDaiLogo,
  StyledWBTCLogo,
  StyledUmaLogo,
  StyledBadgerLogo,
  AssetHeadCell,
  AssetCell,
  ChainsCell,
  ChainsHeadCell,
  DateCell,
  DateHeadCell,
  AddressCell,
  AddressHeadCell,
  BridgeFeeCell,
  BridgeFeeHeadCell,
  ReferralRateCell,
  ReferralRateHeadCell,
  RewardsCell,
  RewardsHeadCell,
  ExplorerLinkContainer,
} from "./RewardTables.styles";
import { ReactComponent as UserIcon } from "assets/user.svg";
import { ReactComponent as ArrowUserIcon } from "assets/corner-down-right.svg";
import { ReactComponent as ExternalLink16 } from "assets/icons/external-link-16.svg";
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
    case "WBTC":
      return <StyledWBTCLogo />;
    case "WETH":
      return <StyledWETHLogo />;
    case "DAI":
      return <StyledDaiLogo />;
    case "UMA":
      return <StyledUmaLogo />;
    case "BADGER":
      return <StyledBadgerLogo />;
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
            <AssetCell>
              {determineIcon(r.symbol)} <div>{r.symbol}</div>{" "}
              {determineReferralIcon(
                account,
                r.depositorAddr,
                r.referralAddress
              )}
            </AssetCell>
          ),
        },
        {
          value: (
            <ChainsCell>
              <div>{getChainInfo(r.sourceChainId).name}</div>
              <GrayText>
                &rarr; {getChainInfo(r.destinationChainId).name}
              </GrayText>
            </ChainsCell>
          ),
        },
        {
          value: (
            <DateCell>
              <div>
                {DateTime.fromISO(r.depositDate).toFormat("dd LLL, yyyy")}
              </div>
              <GrayText>
                {DateTime.fromISO(r.depositDate).toFormat("t")}
              </GrayText>
            </DateCell>
          ),
        },
        {
          value: (
            <AddressCell>
              {shortenAddress(r.depositorAddr, "...", 4)}
            </AddressCell>
          ),
        },
        {
          value: (
            <BridgeFeeCell>
              {r.realizedLpFeeUsd.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 4,
              })}
            </BridgeFeeCell>
          ),
        },
        {
          value: (
            <ReferralRateCell>{`${r.referralRate * 100}%`}</ReferralRateCell>
          ),
        },
        {
          value: (
            <RewardsCell>
              {`${Number(ethers.utils.formatUnits(r.acxRewards, 18)).toFixed(
                4
              )} ACX`}
            </RewardsCell>
          ),
        },
      ],
      explorerLink: (
        <ExplorerLinkContainer>
          <a
            href={getChainInfo(r.sourceChainId).constructExplorerLink(
              r.depositTxHash
            )}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink16 />
          </a>
        </ExplorerLinkContainer>
      ),
    };
  });
  return fr;
}

export const headers: ICell[] = [
  {
    value: <AssetHeadCell>Asset</AssetHeadCell>,
  },
  {
    value: <ChainsHeadCell>From &rarr; To</ChainsHeadCell>,
  },
  {
    value: <DateHeadCell>Date</DateHeadCell>,
  },
  {
    value: <AddressHeadCell>Address</AddressHeadCell>,
  },
  {
    value: <BridgeFeeHeadCell>Bridge fee</BridgeFeeHeadCell>,
  },
  {
    value: <ReferralRateHeadCell>Referral rate</ReferralRateHeadCell>,
  },
  {
    value: <RewardsHeadCell>Rewards</RewardsHeadCell>,
  },
];

const DISCONNECTED_ROWS: IRow[] = Array(2).fill({
  cells: [
    {
      value: (
        <AssetCell>
          <StyledETHIcon /> <div>ETH</div>
        </AssetCell>
      ),
    },
    {
      value: (
        <ChainsCell>
          <div>Ethereum Mainnet</div>
          <GrayText>&rarr; Optimism</GrayText>
        </ChainsCell>
      ),
    },
    {
      value: (
        <DateCell>
          <div>30 Jun, 2022</div>
          <GrayText>12:41 PM</GrayText>
        </DateCell>
      ),
    },
    {
      value: <AddressCell>0x123...4567</AddressCell>,
    },
    { value: <BridgeFeeCell>$1234.56</BridgeFeeCell> },
    {
      value: (
        <ReferralRateCell>
          <div>80%</div>
        </ReferralRateCell>
      ),
    },
    {
      value: <RewardsCell>414.14 ACX</RewardsCell>,
    },
  ],
  explorerLink: (
    <ExplorerLinkContainer disabled={true}>
      <a href="">
        <ExternalLink16 />
      </a>
    </ExplorerLinkContainer>
  ),
});
