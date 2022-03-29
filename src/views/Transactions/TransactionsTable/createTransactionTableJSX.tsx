import { DateTime } from "luxon";
import { ethers } from "ethers";
import { TableLogo, TableLink } from "./TransactionsTable.styles";
import { shortenTransactionHash } from "utils/format";
import { ICell, IRow } from "components/Table/Table";
import { Transaction } from "./createTransactionModel";
import { CHAINS, TOKENS_LIST } from "utils/constants";

// Will take View Model Transaction as arg
export default function createTransactionTableJSX(transactions: Transaction[]) {
  const rows = formatTransactionRows(transactions);
  return rows;
}

// Will take a TransactionsArg
function formatTransactionRows(transactions: Transaction[]): IRow[] {
  return transactions.map((tx) => {
    const timestamp: ICell = {
      size: "sm",
      value: DateTime.fromSeconds(tx.timestamp).toFormat("d MMM yyyy - t"),
    };

    const status: ICell = {
      size: "xs",
      value: tx.filled < 100 ? "Pending" : "Filled",
    };

    const filled: ICell = {
      size: "xs",
      value: `${tx.filled}%`,
    };

    const fromChainName = CHAINS[tx.fromChain].name;
    const fromLogo = CHAINS[tx.fromChain].logoURI;
    const fromChain: ICell = {
      size: "xs",
      value: (
        <>
          <TableLogo src={fromLogo} alt={`${fromChainName}_logo`} />{" "}
          {fromChainName}
        </>
      ),
    };

    const toChainName = CHAINS[tx.toChain].name;
    const toLogo = CHAINS[tx.toChain].logoURI;
    const toChain: ICell = {
      size: "xs",
      value: (
        <>
          <TableLogo src={toLogo} alt={`${toChainName}_logo`} /> {toChainName}
        </>
      ),
    };

    const token = TOKENS_LIST[1].find(
      (x) => x.address === tx.assetContractAddress
    );

    const symbol: ICell = {
      size: "xs",
      value: (
        <>
          <TableLogo src={token?.logoURI} alt={`${token?.name}_logo`} />{" "}
          {token?.name}
        </>
      ),
    };

    const amount: ICell = {
      size: "xs",
      value: ethers.utils.formatEther(tx.amount),
    };

    // TODO: change href to proper url when we get real TX data
    const txHash: ICell = {
      size: "xs",
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

    return {
      cells: [
        timestamp,
        status,
        filled,
        fromChain,
        toChain,
        symbol,
        amount,
        txHash,
      ],
    } as IRow;
  });
}

export const headers: ICell[] = [
  {
    size: "sm",
    value: "Deposit time",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Status",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Filled %",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Source",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Destination",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Asset",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Amount",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: "Deposit tx",
    cellClassName: "header-cell",
  },
];
