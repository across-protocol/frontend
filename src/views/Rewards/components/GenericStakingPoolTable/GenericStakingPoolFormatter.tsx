import { Text } from "components/Text";
import { PopperTooltip } from "components/Tooltip";
import { GenericStakingPoolRowData } from "./GenericStakingPoolTable";
import { IRow } from "components/Table/Table";
import { BigNumber } from "ethers";
import { formatEther } from "utils";
import { ReactComponent as ExternalLink16 } from "assets/icons/arrow-right-16.svg";
import {
  ButtonCell,
  ExternalLinkButton,
  HeaderCell,
  InfoIcon,
  LogoWrapper,
  MultiplierCell,
  PoolCell,
  RowCell,
  StackedCell,
  StakeButton,
  StakedTokenCellInner,
  StyledProgressBar,
} from "./GenericStakingPoolTable.styles";

type RowData = GenericStakingPoolRowData;
type MetaData = {
  hasLPTokens: boolean;
  hasLPStake: boolean;
};

const flexBasisLengths = [
  172, // Pool
  232, // Staked LP Token
  172, // Multiplier
  152, // Reward APY
  168, // Age of Capital
  112, // Rewards
  108, // Button
];

const rawHeader = [
  "Pool",
  "Staked LP Tokens",
  {
    header: "Multiplier",
    tooltip: {
      title: "Multiplier",
      description: "Lorem Ipsum",
    },
  },
  {
    header: "Reward APY",
    tooltip: {
      title: "Multiplier",
      description: "Lorem Ipsum",
    },
  },
  {
    header: "Age of Capital",
    tooltip: {
      title: "Age of Capital",
      description: "Lorem Ipsum",
    },
  },
  "Rewards",
  "",
];

export const headers = rawHeader.map((header, idx) => {
  const text = typeof header === "string" ? header : header.header;
  const toolTip =
    typeof header === "string" ? undefined : (
      <PopperTooltip
        title={header.tooltip.title}
        body={header.tooltip.description}
        placement="bottom-start"
      >
        <InfoIcon />
      </PopperTooltip>
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

function formatPoolCell(data: RowData, _meta: MetaData) {
  return (
    <PoolCell>
      <LogoWrapper>
        <data.logo />
      </LogoWrapper>
      <Text size="md" color="white-100">
        {data.poolName.toUpperCase()}
      </Text>
    </PoolCell>
  );
}

function formatMultiplierCell(data: RowData, meta: MetaData) {
  return (
    <MultiplierCell>
      <StyledProgressBar
        className="pool-progress-bar"
        active={meta.hasLPStake}
        percent={(data.multiplier / 3) * 100}
      />
      <Text size="md" color={`white-${meta.hasLPStake ? "100" : "70"}`}>
        {data.multiplier.toFixed(2)}x
      </Text>
    </MultiplierCell>
  );
}

function formatStakedLPCell(data: RowData, meta: MetaData) {
  const fmtFn = data.lpTokenFormatter;
  return (
    <StackedCell>
      <StakedTokenCellInner>
        <Text size="md" color={`white-${meta.hasLPStake ? 100 : 70}`}>
          {fmtFn(data.usersStakedLP)}
        </Text>
        <Text size="md" color="white-70">
          &nbsp; / {fmtFn(data.usersTotalLP)}
        </Text>
      </StakedTokenCellInner>
      <Text size="sm" color="white-70">
        {data.poolName.toUpperCase()}-LP
      </Text>
    </StackedCell>
  );
}

function formatRewardAPYCell(data: RowData, meta: MetaData) {
  return (
    <StackedCell>
      <Text color={`white-${meta.hasLPStake ? 100 : 70}`} size="md">
        {formatEther(BigNumber.from(100).mul(data.rewardAPY))}%
      </Text>
      <Text color="white-70" size="sm">
        Base: {formatEther(BigNumber.from(100).mul(data.baseAPY))}%
      </Text>
    </StackedCell>
  );
}

function formatAgeofCapitalCell(data: RowData, meta: MetaData) {
  return (
    <Text color={`white-${meta.hasLPStake ? 100 : 70}`} size="md">
      {data.ageOfCapital} Day{data.ageOfCapital !== 1 && "s"}
    </Text>
  );
}

function formatRewardCell(data: RowData, meta: MetaData) {
  return (
    <Text color={`white-${meta.hasLPStake ? 100 : 70}`} size="md">
      {data.rewardFormatter(data.rewards)} ACX
    </Text>
  );
}

function formatButtonCell(data: RowData, meta: MetaData) {
  let button: JSX.Element | undefined = undefined;
  const specificPoolLink = `/rewards/staking/${data.poolName}`;
  if (meta.hasLPStake) {
    button = (
      <ExternalLinkButton to={specificPoolLink}>
        <ExternalLink16 />
      </ExternalLinkButton>
    );
  } else if (meta.hasLPTokens) {
    button = <StakeButton to={specificPoolLink}>Stake</StakeButton>;
  } else {
    button = <StakeButton to={"/pool"}>Add</StakeButton>;
  }
  return <ButtonCell>{button}</ButtonCell>;
}

export function formatRow(data: RowData): IRow {
  const formatterFns = [
    formatPoolCell,
    formatStakedLPCell,
    formatMultiplierCell,
    formatRewardAPYCell,
    formatAgeofCapitalCell,
    formatRewardCell,
  ];
  const meta = {
    hasLPStake: BigNumber.from(data.usersStakedLP).gt(0),
    hasLPTokens: BigNumber.from(data.usersTotalLP).gt(0),
  };
  return {
    cells: formatterFns.map((fn, idx) => ({
      value: <RowCell length={flexBasisLengths[idx]}>{fn(data, meta)}</RowCell>,
    })),
    explorerLink: formatButtonCell(data, meta),
  };
}
