import { Link } from "react-router-dom";
import { BigNumber } from "ethers";

import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { IRow } from "components/Table/Table";
import { formatUnitsWithMaxFractions, formatWeiPct, getToken } from "utils";
import { ReactComponent as ExternalLink16 } from "assets/icons/chevron-right.svg";
import {
  ButtonCell,
  ExternalLinkButton,
  HeaderCell,
  HorizontalStackedCell,
  InfoIcon,
  PoolCell,
  LogoWrapper,
  MultiplierCell,
  PoolTextStack,
  RewardCell,
  RewardConnectorTextWrapper,
  RowCell,
  StackedCell,
  StakeButton,
  StakedTokenCellInner,
  StyledConnectorVector,
  StyledProgressBar,
  ExternalStackedCell,
  ExternalTextCell,
  RewardCellLogoTextWrapper,
  RewardCellLogo,
} from "./GenericStakingPoolTable.styles";
import { StyledPoolIcon } from "components/RewardTable/RewardTables.styles";
import { StakingPool } from "utils/staking-pool";
import { IconPair } from "components/IconPair";

type RowData = StakingPool;
type MetaData = {
  hasLPTokens: boolean;
  hasLPStake: boolean;
  hasRewards: boolean;
  greyscaleTokenLogo: boolean;
};

const flexBasisLengths = [
  250, // Pool
  176, // Staked LP Token
  200, // Reward APY
  176, // Multiplier
  152, // Age of Capital
  96, // Rewards
  108, // Button
];

const rawHeader: (
  | string
  | {
      header: string;
      tooltip: {
        title: string;
        description: string;
      };
    }
)[] = [
  "Pool",
  {
    header: "Staked LP Tokens",
    tooltip: {
      title: "Staked LP Tokens",
      description:
        "This displays your staked LP token amount. The amount in underlying can be seen in the Pool tab.",
    },
  },
  {
    header: "APY",
    tooltip: {
      title: "APY",
      description:
        "Your total APY for the pool, including the pool APY plus rewards APR times your multiplier. Max APY is the maximum APY after you have staked your LP tokens for 100 days.",
    },
  },
  {
    header: "Multiplier",
    tooltip: {
      title: "Multiplier",
      description:
        "Your multiple applied to the pool's base reward APY, based on your age of capital.",
    },
  },
  {
    header: "Age of Capital",
    tooltip: {
      title: "Age of Capital",
      description:
        "Number of days you’ve staked LP tokens without claiming rewards. Weighted by size if multiple positions have been staked.",
    },
  },
  "Rewards",
  "",
];

export const headers = rawHeader.map((header, idx) => {
  const text = typeof header === "string" ? header : header.header;
  const toolTip =
    typeof header === "string" ? undefined : (
      <Tooltip
        title={header.tooltip.title}
        body={header.tooltip.description}
        placement="bottom-start"
      >
        <InfoIcon />
      </Tooltip>
    );

  return {
    value: (
      <HeaderCell length={flexBasisLengths[idx]}>
        <Text color="white-70" size="md">
          {text}
        </Text>
        {toolTip}
      </HeaderCell>
    ),
  };
});

type PoolRowCellType = {
  data: RowData;
  meta: MetaData;
};

function RowPoolCell({ data, meta }: PoolRowCellType) {
  return (
    <PoolCell>
      {data.tokenLogsURIs ? (
        <IconPair
          LeftIcon={
            <StyledPoolIcon
              greyscale={meta.greyscaleTokenLogo}
              src={data.tokenLogsURIs[0]}
            />
          }
          RightIcon={
            <StyledPoolIcon
              greyscale={meta.greyscaleTokenLogo}
              src={data.tokenLogsURIs[1]}
            />
          }
        />
      ) : (
        <LogoWrapper>
          <StyledPoolIcon
            greyscale={meta.greyscaleTokenLogo}
            src={data.tokenLogoURI}
          />
        </LogoWrapper>
      )}
      <PoolTextStack>
        <Text size="md" color="white-100">
          {data.tokenDisplaySymbol || data.tokenSymbol.toUpperCase()}
        </Text>
        <Text size="sm" color="grey-400">
          Position size:{" "}
          {data.lpTokenFormatter(
            data.convertLPToUnderlying(data.usersTotalLPTokens)
          )}
        </Text>
      </PoolTextStack>
    </PoolCell>
  );
}

function RowMultiplierCell({ data, meta }: PoolRowCellType) {
  return (
    <MultiplierCell>
      <StyledProgressBar
        className="pool-progress-bar"
        active={meta.hasLPStake}
        percent={data.usersMultiplierPercentage}
      />
      <Text size="md" color={`white-${meta.hasLPStake ? "100" : "70"}`}>
        {Number(
          formatUnitsWithMaxFractions(data.currentUserRewardMultiplier, 18)
        ).toFixed(2)}
        x
      </Text>
    </MultiplierCell>
  );
}

function RowStakedLPCell({ data, meta }: PoolRowCellType) {
  const fmtFn = data.lpTokenFormatter;
  return (
    <ExternalStackedCell>
      <StakedTokenCellInner>
        <Text size="md" color={`white-${meta.hasLPStake ? 100 : 70}`}>
          {fmtFn(data.userAmountOfLPStaked)}
        </Text>
        <Text size="md" color="white-70">
          &nbsp; / {fmtFn(data.usersTotalLPTokens)}
        </Text>
      </StakedTokenCellInner>
      <Text size="sm" color="white-70">
        {data.isExternalLP
          ? data.tokenDisplaySymbol
          : data.lpTokenSymbolName.toUpperCase()}
      </Text>
    </ExternalStackedCell>
  );
}

function RowRewardAPYCell({ data, meta }: PoolRowCellType) {
  return (
    <RewardCell>
      <HorizontalStackedCell>
        <Text color={`white-${meta.hasLPStake ? 100 : 70}`} size="md">
          {formatWeiPct(data.apyData.totalApy, 2)}% &nbsp;
        </Text>
        <Text color="white-70" size="md">
          / Max {formatWeiPct(data.apyData.maxApy, 2)}%
        </Text>
      </HorizontalStackedCell>
      <RewardConnectorTextWrapper>
        <StyledConnectorVector />
        <StackedCell>
          <Text color="grey-400" size="sm">
            Pool: {formatWeiPct(data.apyData.poolApy, 2)}%
          </Text>
          <Text color="grey-400" size="sm">
            Rewards: {formatWeiPct(data.apyData.rewardsApy, 2)}%
          </Text>
        </StackedCell>
      </RewardConnectorTextWrapper>
    </RewardCell>
  );
}

function RowAgeofCapitalCell({ data, meta }: PoolRowCellType) {
  return (
    <ExternalTextCell>
      <Text color={`white-${meta.hasLPStake ? 100 : 70}`} size="md">
        {data.elapsedTimeSinceAvgDeposit} Day
        {data.elapsedTimeSinceAvgDeposit !== 1 && "s"}
      </Text>
    </ExternalTextCell>
  );
}

function RowRewardCell({ data, meta }: PoolRowCellType) {
  return (
    <ExternalTextCell>
      <RewardCellLogoTextWrapper>
        <RewardCellLogo src={getToken("ACX").logoURI} />
        <Text color={`white-${meta.hasLPStake ? 100 : 70}`} size="md">
          {formatUnitsWithMaxFractions(data.outstandingRewards, 18)} ACX
        </Text>
      </RewardCellLogoTextWrapper>
    </ExternalTextCell>
  );
}

function RowButtonCell({ data, meta }: PoolRowCellType) {
  let button: JSX.Element | undefined = undefined;
  const specificPoolLink = `/rewards/staking/${data.tokenSymbol.toLowerCase()}`;
  if (meta.hasLPStake) {
    button = (
      <ExternalLinkButton to={specificPoolLink}>
        <ExternalLink16 />
      </ExternalLinkButton>
    );
  } else if (meta.hasLPTokens || meta.hasRewards) {
    button = (
      <StakeButton>
        <Link to={specificPoolLink}>Stake</Link>
      </StakeButton>
    );
  } else {
    button = (
      <StakeButton>
        {data.externalLinkToLP ? (
          <a href={data.externalLinkToLP} target="_blank" rel="noreferrer">
            Add
          </a>
        ) : (
          <Link to={`/pool?symbol=${data.tokenSymbol.toLowerCase()}`}>Add</Link>
        )}
      </StakeButton>
    );
  }
  return <ButtonCell>{button}</ButtonCell>;
}

export function formatRow(data: RowData, greyscaleTokenLogo: boolean): IRow {
  const rowComponents = [
    RowPoolCell,
    RowStakedLPCell,
    RowRewardAPYCell,
    RowMultiplierCell,
    RowAgeofCapitalCell,
    RowRewardCell,
  ];
  const meta = {
    hasLPStake: BigNumber.from(data.userAmountOfLPStaked).gt(0),
    hasLPTokens: BigNumber.from(data.usersTotalLPTokens).gt(0),
    hasRewards: BigNumber.from(data.outstandingRewards).gt(0),
    greyscaleTokenLogo,
  };
  return {
    cells: rowComponents.map((Cell, idx) => ({
      value: (
        <RowCell length={flexBasisLengths[idx]}>
          {<Cell data={data} meta={meta} />}
        </RowCell>
      ),
    })),
    explorerLink: <RowButtonCell data={data} meta={meta} />,
  };
}
