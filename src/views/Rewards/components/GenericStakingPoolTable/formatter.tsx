import styled from "@emotion/styled";
import { BaseHeadCell } from "components/Table";
import { Text } from "components/Text";
import { PopperTooltip } from "components/Tooltip";
import { ReactComponent as II } from "assets/icons/info-16.svg";
import { GenericStakingPoolRowData } from "./GenericStakingPoolTable";
import { IRow } from "components/Table/Table";

type RowData = GenericStakingPoolRowData;

const flexBasisLengths = [
  172, // Pool
  232, // Staked LP Token
  168, // Multiplier
  144, // Reward APY
  152, // Age of Capital
  112, // Rewards
  236, // Button
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

const Cell = styled(BaseHeadCell)<{ length: number }>`
  flex: 0 0 ${({ length }) => length}px;
`;

const InfoIcon = styled(II)`
  cursor: pointer;
`;

const HeaderCell = styled(Cell)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
`;

const RowCell = styled(Cell)`
  padding: 20px 16px;
  background: transparent;

  border-top: 1px solid #3e4047;
`;

const PoolCell = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 24px;
`;

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
        <Text color="white-70" size="lg">
          {text}
        </Text>
        {toolTip}
      </HeaderCell>
    ),
  };
});

function formatPoolCell(data: RowData) {
  return (
    <PoolCell>
      <data.logo />
      <Text size="lg" color="white-100">
        {data.poolName.toUpperCase()}
      </Text>
    </PoolCell>
  );
}

export function formatRow(data: RowData): IRow {
  const formatterFns = [formatPoolCell];

  return {
    cells: formatterFns.map((fn, idx) => ({
      value: <RowCell length={flexBasisLengths[idx]}>{fn(data)}</RowCell>,
    })),
  };
}
