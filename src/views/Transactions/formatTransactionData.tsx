import {
  TableLogo,
  TableLink,
} from "./TransactionsTable/TransactionsTable.styles";
import { shortenTransactionHash } from "utils/format";
import { ICell, IRow } from "components/Table/Table";

import arbLogo from "assets/arbitrum-logo.svg";
import umaLogo from "assets/UMA-round.svg";
import ethLogo from "assets/ethereum-logo.svg";
import { Transaction } from "./createTransactionModel";
import { DateTime } from "luxon";
import { ethers } from "ethers";
// Stub of function.
// Will take View Model Transaction as arg
export default function formatTransactionsData(transactions: Transaction[]) {
  const rows = formatRows(transactions);
  const filledTx = rows.filter((x, i) => i !== 0);
  const ongoingTx = rows.filter((x, i) => i === 0);
  return {
    headers,
    ongoingTx,
    filledTx,
  };
}

// Will take a TransactionsArg
function formatRows(transactions: Transaction[]) {
  const rows: IRow[] = [];
  transactions.forEach((tx) => {
    const row: IRow = {
      cells: [],
    };

    const timestamp: ICell = {
      size: "lg",
      value: DateTime.fromSeconds(tx.timestamp).toString(),
    };
    row.cells.push(timestamp);

    const status: ICell = {
      size: "sm",
      value: tx.filled !== 100 ? "Pending" : "Filled",
    };
    row.cells.push(status);

    const filled: ICell = {
      size: "sm",
      value: `${tx.filled}%`,
    };
    row.cells.push(filled);

    const fromChain: ICell = {
      size: "sm",
      value: (
        <>
          <TableLogo src={arbLogo} alt="chain_logo" /> Arbitrum
        </>
      ),
    };
    row.cells.push(fromChain);

    const toChain: ICell = {
      size: "sm",
      value: (
        <>
          <TableLogo src={ethLogo} alt="chain_logo" /> Ethereum
        </>
      ),
    };
    row.cells.push(toChain);

    const symbol: ICell = {
      size: "sm",
      value: (
        <>
          <TableLogo src={umaLogo} alt="chain_logo" /> UMA
        </>
      ),
    };
    row.cells.push(symbol);

    const amount: ICell = {
      size: "sm",
      value: ethers.utils.formatEther(tx.amount),
    };
    row.cells.push(amount);

    const txHash: ICell = {
      size: "sm",
      value: (
        <TableLink
          href={`https://etherscan.io/address/${tx.txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          {shortenTransactionHash(tx.txHash)}
        </TableLink>
      ),
    };
    row.cells.push(txHash);

    rows.push(row);
  });

  return rows;
}

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
