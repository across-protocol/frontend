import { DateTime } from "luxon";
import { ethers } from "ethers";
import { TableLogo, TableLink } from "./TransactionsTable.styles";
import { shortenTransactionHash } from "utils/format";
import { ICell, IRow } from "components/Table/Table";
import { Transaction } from "./createTransactionModel";
import { CHAINS, TOKENS_LIST } from "utils/constants";

// Will take View Model Transaction as arg
export default function createMobileTransactionTableJSX(
  transactions: Transaction[]
) {
  const rows = formatTransactionRows(transactions);
  return rows;
}

// Will take a TransactionsArg
function formatTransactionRows(transactions: Transaction[]): IRow[] {
  return transactions.map((tx) => {
    const row: IRow = {
      cells: [],
    };

    const timestamp: ICell = {
      size: "lg",
      value: DateTime.fromSeconds(tx.timestamp).toFormat("d MMM yyyy - t"),
    };
    row.cells.push(timestamp);

    const status: ICell = {
      size: "sm",
      value: tx.filled < 100 ? "Pending" : "Filled",
    };
    row.cells.push(status);

    const filled: ICell = {
      size: "sm",
      value: `${tx.filled}%`,
    };
    row.cells.push(filled);

    const fromChainName = CHAINS[tx.fromChain].name;
    const fromLogo = CHAINS[tx.fromChain].logoURI;
    const fromChain: ICell = {
      size: "sm",
      value: (
        <>
          <TableLogo src={fromLogo} alt={`${fromChainName}_logo`} />{" "}
          {fromChainName}
        </>
      ),
    };
    row.cells.push(fromChain);

    const toChainName = CHAINS[tx.toChain].name;
    const toLogo = CHAINS[tx.fromChain].logoURI;
    const toChain: ICell = {
      size: "sm",
      value: (
        <>
          <TableLogo src={toLogo} alt={`${toChainName}_logo`} /> {toChainName}
        </>
      ),
    };
    row.cells.push(toChain);

    const token = TOKENS_LIST[1].find(
      (x) => x.address === tx.assetContractAddress
    );
    const symbol: ICell = {
      size: "sm",
      value: (
        <>
          <TableLogo src={token?.logoURI} alt={`${token?.name}_logo`} />{" "}
          {token?.name}
        </>
      ),
    };
    row.cells.push(symbol);

    const amount: ICell = {
      size: "sm",
      value: ethers.utils.formatEther(tx.amount),
    };
    row.cells.push(amount);

    // TODO: change href to proper url when we get real TX data
    const txHash: ICell = {
      size: "sm",
      value: (
        <TableLink
          href={`https://etherscan.io/tx/${tx.txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          {shortenTransactionHash(tx.txHash)}
        </TableLink>
      ),
    };
    row.cells.push(txHash);

    return row;
  });
}

export const headers: ICell[] = [
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
