import { DateTime } from "luxon";
import { getChainInfo, shortenAddress } from "utils";
import { ethers } from "ethers";
import { ICell, IRow } from "components/Table/Table.d";
import { Referral } from "hooks/useReferrals";
import {
  StyledETHIcon,
  GrayText,
  StyledUNILogo,
  StyledUSDCLogo,
  ReferralIconContainer,
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
import { ReactComponent as ExternalLink16 } from "assets/icons/external-link-16.svg";
import { ReactComponent as RefereeIcon } from "assets/icons/referree.svg";
import { ReactComponent as ReferrerIcon } from "assets/icons/referrer.svg";
import { ReactComponent as SelfReferralIcon } from "assets/icons/self-referral.svg";
import { PopperTooltip, TooltipIcon } from "components/Tooltip";

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
  let title;
  let body;
  let icon: TooltipIcon;

  if (account === depositAddr && account === referralAddr) {
    title = "Self-referral transfer";
    body =
      "This transfer was made from your wallet address using your own referral link.";
    icon = "self-referral";
  } else if (account === referralAddr) {
    title = "Referral transfer";
    body = "This transfer was made by someone using your unique referral link.";
    icon = "referral";
  } else {
    title = "Referee transfer";
    body =
      "This transfer was made from your wallet address using an external referral link.";
    icon = "referee";
  }

  return (
    <PopperTooltip
      title={title}
      body={body}
      icon={icon}
      placement="bottom-start"
    >
      <ReferralIconContainer>
        {(() => {
          if (account === depositAddr && account === referralAddr) {
            return <SelfReferralIcon />;
          } else if (account === referralAddr) {
            return <ReferrerIcon />;
          } else {
            return <RefereeIcon />;
          }
        })()}
      </ReferralIconContainer>
    </PopperTooltip>
  );
}

// Will take a TransactionsArg
function formatMyReferralsRows(referrals: Referral[], account: string): IRow[] {
  const fr = referrals.map((r, i) => {
    return {
      cells: [
        {
          value: (
            <AssetCell>
              {determineIcon(r.symbol)}
              <div>{r.symbol}</div>
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
              {shortenAddress(r.depositorAddr, "..", 4)}
            </AddressCell>
          ),
        },
        {
          value: (
            <BridgeFeeCell>
              {(r.realizedLpFeeUsd || r.bridgeFeeUsd || 0).toLocaleString(
                "en-US",
                {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 4,
                }
              )}
            </BridgeFeeCell>
          ),
        },
        {
          value: (
            <ReferralRateCell>{`${(() => {
              let referralRate = 0;
              if (
                account === r.depositorAddr &&
                account === r.referralAddress
              ) {
                referralRate = r.referralRate * 100;
              } else if (account === r.referralAddress) {
                referralRate = r.referralRate * 100 * 0.75;
              } else {
                referralRate = r.referralRate * 100 * 0.25;
              }

              return `${referralRate}%`;
            })()}`}</ReferralRateCell>
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
        <AssetCell key={1}>
          <StyledETHIcon /> <div>ETH</div>
        </AssetCell>
      ),
    },
    {
      value: (
        <ChainsCell key={2}>
          <div>Ethereum Mainnet</div>
          <GrayText>&rarr; Optimism</GrayText>
        </ChainsCell>
      ),
    },
    {
      value: (
        <DateCell key={3}>
          <div>30 Jun, 2022</div>
          <GrayText>12:41 PM</GrayText>
        </DateCell>
      ),
    },
    {
      value: <AddressCell key={4}>0x123...4567</AddressCell>,
    },
    { value: <BridgeFeeCell key={5}>$1234.56</BridgeFeeCell> },
    {
      value: (
        <ReferralRateCell key={6}>
          <div>80%</div>
        </ReferralRateCell>
      ),
    },
    {
      value: <RewardsCell key={7}>414.14 ACX</RewardsCell>,
    },
  ],
  explorerLink: (
    <ExplorerLinkContainer disabled={true}>
      <a href="https://across.to">
        <ExternalLink16 />
      </a>
    </ExplorerLinkContainer>
  ),
});
