import { ICell, IRow } from "components/Table/Table";
import {
  StyledTableWrapper,
  StyledHeadRow,
  StyledBody,
  StyledRow,
  StyledCell,
  Wrapper,
  Title,
  TableLogo,
} from "./TransactionTable.styles";
import arbLogo from "assets/arbitrum-logo.svg";
import umaLogo from "assets/UMA-round.svg";
import ethLogo from "assets/ethereum-logo.svg";

const hc: ICell[] = [
  {
    size: "lg",
    value: "Deposit time",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Status",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Filled %",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Source",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Destination",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Asset",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Amount",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Deposit tx",
    cellClassName: "header-cell",
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
        value: (
          <>
            <TableLogo src={arbLogo} alt="arbitrum_logo" /> Arbitrum
          </>
        ),
      },
      {
        size: "sm",
        value: (
          <>
            <TableLogo src={ethLogo} alt="arbitrum_logo" /> Ethereum
          </>
        ),
      },
      {
        size: "sm",
        value: (
          <>
            <TableLogo src={umaLogo} alt="arbitrum_logo" /> UMA
          </>
        ),
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
        value: (
          <>
            <TableLogo src={arbLogo} alt="arbitrum_logo" /> Arbitrum
          </>
        ),
      },
      {
        size: "sm",
        value: (
          <>
            <TableLogo src={ethLogo} alt="arbitrum_logo" /> Ethereum
          </>
        ),
      },
      {
        size: "sm",
        value: (
          <>
            <TableLogo src={umaLogo} alt="arbitrum_logo" /> UMA
          </>
        ),
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
        value: (
          <>
            <TableLogo src={arbLogo} alt="arbitrum_logo" /> Arbitrum
          </>
        ),
      },
      {
        size: "sm",
        value: (
          <>
            <TableLogo src={ethLogo} alt="arbitrum_logo" /> Ethereum
          </>
        ),
      },
      {
        size: "sm",
        value: (
          <>
            <TableLogo src={umaLogo} alt="arbitrum_logo" /> UMA
          </>
        ),
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
