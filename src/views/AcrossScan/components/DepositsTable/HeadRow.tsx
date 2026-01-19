import styled from "@emotion/styled";
import { ReactComponent as II } from "assets/icons/info.svg";
import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { COLORS } from "utils";

export type HeaderCells = typeof headerCells;
export type ColumnKey = keyof HeaderCells;
export type ColumnTooltipRecord = Partial<
  Record<ColumnKey, { title: string; content: string }>
>;

export const headerCells = {
  asset: {
    label: "Asset",
    width: 136,
  },
  amount: {
    label: "Amount",
    width: 96,
  },
  route: {
    label: "Route",
    width: 152,
  },
  address: {
    label: "Address",
    width: 108,
  },
  date: {
    label: "Date",
    width: 94,
  },
  status: {
    label: "Status",
    width: 120,
  },
  transactions: {
    label: "Transactions",
    width: 148,
  },
  netFee: {
    label: "Net fee",
    width: 128,
  },
  bridgeFee: {
    label: "Fees",
    width: 136,
  },
  rewardsRate: {
    label: "Rewards rate",
    width: 104,
  },
  rewards: {
    label: "Rewards",
    width: 128,
  },
  timeAgo: {
    label: "Time",
    width: 84,
  },
  actions: {
    label: "",
    width: 64,
  },
};

export function HeadRow({
  disabledColumns = [],
  columnTooltips,
}: {
  disabledColumns?: ColumnKey[];
  columnTooltips?: ColumnTooltipRecord;
}) {
  return (
    <StyledHead>
      <StyledRow>
        {Object.entries(headerCells).map(([key, value]) =>
          disabledColumns.includes(key as ColumnKey) ? null : (
            <StyledCell key={key} width={value.width}>
              <Text color="grey-400">{value.label}</Text>
              {columnTooltips?.[key as ColumnKey] && (
                <StylizedTooltip
                  tooltipId={key}
                  title={columnTooltips[key as ColumnKey]?.title}
                  body={
                    <BodyText size="md">
                      {columnTooltips[key as ColumnKey]?.content ?? ""}
                    </BodyText>
                  }
                  placement="bottom-start"
                >
                  <InfoIcon />
                </StylizedTooltip>
              )}
            </StyledCell>
          )
        )}
      </StyledRow>
    </StyledHead>
  );
}

const StyledHead = styled.thead``;

const StyledRow = styled.tr`
  display: flex;
  height: 40px;
  justify-content: space-between;
  align-items: center;
  padding: 0px 24px;
  gap: 16px;

  background-color: ${COLORS["black-700"]};
  border-radius: 12px 12px 0px 0px;
  border: ${COLORS["grey-600"]} 1px solid;
`;

const StyledCell = styled.th<{ width: number }>`
  display: flex;
  width: ${({ width }) => width}px;
  gap: 4px;
  flex-direction: row;
  align-items: center;
  padding-right: 4px;
`;

const InfoIcon = styled(II)`
  height: 14px;
  width: 14px;
  margin-bottom: -3px;
`;

const StylizedTooltip = styled(Tooltip)`
  width: fit-content;
  height: fit-content;
  text-align: left;
`;

const BodyText = styled(Text)`
  text-align: left;
`;
