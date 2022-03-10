import { TableLogo, TableLink } from "./TransactionTable.styles";
import { shortenTransactionHash } from "utils/format";
import { ICell, IRow } from "components/Table/Table";

import arbLogo from "assets/arbitrum-logo.svg";
import umaLogo from "assets/UMA-round.svg";
import ethLogo from "assets/ethereum-logo.svg";

// Stub of function.
// Will take View Model Transaction as arg
export function formatTransactions() {
  const headers: ICell[] = [
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
          value: "Pending",
        },
        {
          size: "sm",
          value: "43%",
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
          value: (
            <TableLink
              href="https://etherscan.io/address/0x0000000000000000000000000000000000000000"
              target="_blank"
              rel="noreferrer"
            >
              {shortenTransactionHash(
                "0x0000000000000000000000000000000000000000"
              )}
            </TableLink>
          ),
        },
      ],
    },
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
          value: (
            <TableLink
              href="https://etherscan.io/address/0x0000000000000000000000000000000000000000"
              target="_blank"
              rel="noreferrer"
            >
              {shortenTransactionHash(
                "0x0000000000000000000000000000000000000000"
              )}
            </TableLink>
          ),
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
          value: (
            <TableLink
              href="https://etherscan.io/address/0x0000000000000000000000000000000000000000"
              target="_blank"
              rel="noreferrer"
            >
              {shortenTransactionHash(
                "0x0000000000000000000000000000000000000000"
              )}
            </TableLink>
          ),
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
          value: (
            <TableLink
              href="https://etherscan.io/address/0x0000000000000000000000000000000000000000"
              target="_blank"
              rel="noreferrer"
            >
              {shortenTransactionHash(
                "0x0000000000000000000000000000000000000000"
              )}
            </TableLink>
          ),
        },
      ],
    },
  ];

  return { headers, rows };
}
