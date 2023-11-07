import styled from "@emotion/styled";

import { Text } from "components/Text";

import { COLORS } from "utils";

export type HeaderCells = typeof headerCells;

export type ColumnKey = keyof HeaderCells;

export const headerCells = {
  asset: {
    label: "Asset",
    width: 124,
  },
  amount: {
    label: "Amount",
    width: 104,
  },
  route: {
    label: "Route",
    width: 206,
  },
  address: {
    label: "Address",
    width: 112,
  },
  date: {
    label: "Date",
    width: 104,
  },
  status: {
    label: "Status",
    width: 144,
  },
  transactions: {
    label: "Transactions",
    width: 176,
  },
  netFee: {
    label: "Net fee",
    width: 136,
  },
  loyaltyRate: {
    label: "Loyalty rate",
    width: 104,
  },
  rewards: {
    label: "Rewards",
    width: 136,
  },
  actions: {
    label: "",
    width: 64,
  },
};

export function HeadRow({
  disabledColumns = [],
}: {
  disabledColumns?: ColumnKey[];
}) {
  return (
    <StyledHead>
      <StyledRow>
        {Object.entries(headerCells).map(([key, value]) =>
          disabledColumns.includes(key as ColumnKey) ? null : (
            <StyledCell key={key} width={value.width}>
              <Text color="grey-400">{value.label}</Text>
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
  align-items: center;
  padding: 0px 24px;
  gap: 16px;

  background-color: ${COLORS["black-700"]};
  border-radius: 12px 12px 0px 0px;
  border: ${COLORS["grey-600"]} 1px solid;
  border-bottom: 0px;
`;

const StyledCell = styled.th<{ width: number }>`
  display: flex;
  width: ${({ width }) => width}px;
`;
