import { DateTime } from "luxon";
import { ethers } from "ethers";
import { TableLogo, TableLink } from "./TransactionsTable.styles";
import { shortenTransactionHash, capitalizeFirstLetter } from "utils/format";
import { ICell, IRow } from "components/Table/Table";
import { CHAINS, TOKENS_LIST } from "utils/constants";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history/model";
import { ChainId } from "utils";
/* 
amount: BigNumber {_hex: '0x058d15e176280000', _isBigNumber: true}
assetAddr: "0x4200000000000000000000000000000000000006"
depositId: 30
depositTime: 1649250685
depositTxHash: "0xee6cb6d715cba27bba9aed66bdb12edc3086a8012047ebcf24e7cea2cf85c558"
destinationChainId: 42
filled: BigNumber {_hex: '0x00', _isBigNumber: true}
sourceChainId: 69
status: "pending"
*/

// Will take View Model Transaction as arg
export default function createTransactionTableJSX(transactions: Transfer[]) {
  const rows = formatTransactionRows(transactions);
  return rows;
}

// Will take a TransactionsArg
function formatTransactionRows(transactions: Transfer[]): IRow[] {
  return transactions.map((tx) => {
    const timestamp: ICell = {
      size: "sm",
      value: DateTime.fromSeconds(tx.depositTime).toFormat("d MMM yyyy - t"),
    };

    const status: ICell = {
      size: "xs",
      value: capitalizeFirstLetter(tx.status),
    };

    const fp = tx.filled.div(tx.amount).mul(100);
    const filled: ICell = {
      size: "xs",
      value: `${fp.toNumber() > 100 ? "100" : fp}%`,
    };

    const sourceChainId = tx.sourceChainId as ChainId;

    const fromChainName = CHAINS[sourceChainId].name;
    const fromLogo = CHAINS[sourceChainId].logoURI;
    const fromChain: ICell = {
      size: "xs",
      value: (
        <>
          <TableLogo src={fromLogo} alt={`${fromChainName}_logo`} />{" "}
          {fromChainName}
        </>
      ),
    };

    const destinationChainId = tx.destinationChainId as ChainId;

    const toChainName = CHAINS[destinationChainId].name;
    const toLogo = CHAINS[destinationChainId].logoURI;
    const toChain: ICell = {
      size: "xs",
      value: (
        <>
          <TableLogo src={toLogo} alt={`${toChainName}_logo`} /> {toChainName}
        </>
      ),
    };

    const token = TOKENS_LIST[sourceChainId].find(
      (x) => x.address === tx.assetAddr
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
          href={`https://etherscan.io/tx/${tx.depositTxHash}`}
          target="_blank"
          rel="noreferrer"
        >
          {shortenTransactionHash(tx.depositTxHash)}
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
