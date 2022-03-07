import { ICell, IRow } from "components/Table/Table";
import {
  StyledTableWrapper,
  StyledHeadRow,
  StyledBody,
  StyledRow,
  StyledCell,
  Wrapper,
  Title,
} from "./TransactionTable.styles";

const hc: ICell[] = [
  {
    size: "lg",
    value: "Deposit time",
  },
  {
    size: "sm",
    value: "Status",
  },
  {
    size: "sm",
    value: "Filled %",
  },
  {
    size: "sm",
    value: "Source",
  },
  {
    size: "sm",
    value: "Destination",
  },
  {
    size: "sm",
    value: "Asset",
  },
  {
    size: "sm",
    value: "Amount",
  },
  {
    size: "sm",
    value: "Deposit tx",
  },
];

const rows: IRow[] = [
  {
    cells: [
      {
        size: "lg",
        value: "5 Feb 2022 - 5:41 AM",
      },
      {
        size: "sm",
        value: "Filled",
      },
      {
        size: "sm",
        value: "100%",
      },
      {
        size: "sm",
        value: "Arbitrum",
      },
      {
        size: "sm",
        value: "Ethereum",
      },
      {
        size: "sm",
        value: "UMA",
      },
      {
        size: "sm",
        value: "5000",
      },
      {
        size: "sm",
        value: "0x123...",
      },
    ],
  },
  {
    cells: [
      {
        size: "lg",
        value: "1 Feb 2022 - 8:22 PM",
      },
      {
        size: "sm",
        value: "Filled",
      },
      {
        size: "sm",
        value: "100%",
      },
      {
        size: "sm",
        value: "Arbitrum",
      },
      {
        size: "sm",
        value: "Ethereum",
      },
      {
        size: "sm",
        value: "UMA",
      },
      {
        size: "sm",
        value: "5000",
      },
      {
        size: "sm",
        value: "0x123...",
      },
    ],
  },
  {
    cells: [
      {
        size: "lg",
        value: "22 Jan 2022 - 8:08 AM",
      },
      {
        size: "sm",
        value: "Filled",
      },
      {
        size: "sm",
        value: "100%",
      },
      {
        size: "sm",
        value: "Arbitrum",
      },
      {
        size: "sm",
        value: "Ethereum",
      },
      {
        size: "sm",
        value: "UMA",
      },
      {
        size: "sm",
        value: "5000",
      },
      {
        size: "sm",
        value: "0x123...",
      },
    ],
  },
];

const TransactionsTable = () => {
  return (
    <Wrapper>
      <Title>History</Title>
      <StyledTableWrapper>
        <StyledHeadRow>
          {hc.map((cell, index) => {
            return (
              <StyledCell
                key={index}
                className={cell.cellClassName ?? ""}
                size={cell.size}
              >
                {cell.value}
              </StyledCell>
            );
          })}
        </StyledHeadRow>
        <StyledBody>
          {rows.map((row, ridx) => {
            return (
              <StyledRow key={ridx}>
                {row.cells.map((cell, cidx) => {
                  return (
                    <StyledCell
                      className={cell.cellClassName ?? ""}
                      key={cidx}
                      size={cell.size}
                    >
                      {cell.value}
                    </StyledCell>
                  );
                })}
              </StyledRow>
            );
          })}
        </StyledBody>
      </StyledTableWrapper>
    </Wrapper>
  );
};

export default TransactionsTable;
