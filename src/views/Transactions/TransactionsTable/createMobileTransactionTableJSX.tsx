import { DateTime } from "luxon";
import { ethers } from "ethers";
import {
  TableLogo,
  MobileTableLink,
  MobileChevron,
} from "./TransactionsTable.styles";
import { shortenTransactionHash } from "utils/format";
import { ICell, IRow } from "components/Table/Table";
import { Transaction } from "./createTransactionModel";
import { CHAINS, TOKENS_LIST } from "utils/constants";
import { CLOSED_DROPDOWN_INDEX } from "../useTransactionsView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

export interface IMobileRow extends IRow {
  toChain: React.ReactElement;
  fromChain: React.ReactElement;
  symbol: React.ReactElement;
  amount: string;
  txHash: React.ReactElement;
  onClick?: () => void;
}

// Will take View Model Transaction as arg
export default function createMobileTransactionTableJSX(
  transactions: Transaction[],
  setOpenIndex: React.Dispatch<React.SetStateAction<number>>
) {
  const rows = formatTransactionRows(transactions, setOpenIndex);
  return rows;
}

// Will take a TransactionsArg
function formatTransactionRows(
  transactions: Transaction[],
  setOpenIndex: React.Dispatch<React.SetStateAction<number>>
): IMobileRow[] {
  return transactions.map((tx, index) => {
    const timestamp: ICell = {
      size: "md",
      value: DateTime.fromSeconds(tx.timestamp).toFormat("d MMM yyyy - t"),
    };

    const status: ICell = {
      size: "sm",
      value: tx.filled < 100 ? "Pending" : "Filled",
    };

    const downChevron: ICell = {
      size: "xs",
      value: (
        <MobileChevron>
          <FontAwesomeIcon icon={faChevronDown} />
        </MobileChevron>
      ),
    };

    const fromChainName = CHAINS[tx.fromChain].name;
    const fromLogo = CHAINS[tx.fromChain].logoURI;
    const fromChain = (
      <>
        <TableLogo src={fromLogo} alt={`${fromChainName}_logo`} />{" "}
        {fromChainName}
      </>
    );
    const toChainName = CHAINS[tx.toChain].name;
    const toLogo = CHAINS[tx.toChain].logoURI;
    const toChain = (
      <>
        <TableLogo src={toLogo} alt={`${toChainName}_logo`} /> {toChainName}
      </>
    );

    const token = TOKENS_LIST[1].find(
      (x) => x.address === tx.assetContractAddress
    );
    const symbol = (
      <>
        <TableLogo src={token?.logoURI} alt={`${token?.name}_logo`} />{" "}
        {token?.name}
      </>
    );

    const amount = ethers.utils.formatEther(tx.amount);

    // TODO: change href to proper url when we get real TX data
    const txHash = (
      <MobileTableLink
        href={`https://etherscan.io/tx/${tx.txHash}`}
        target="_blank"
        rel="noreferrer"
      >
        {shortenTransactionHash(tx.txHash)}
      </MobileTableLink>
    );

    return {
      cells: [timestamp, status, downChevron],
      fromChain,
      toChain,
      symbol,
      amount,
      txHash,
      onClick: () => {
        setOpenIndex((prevValue) =>
          prevValue !== index ? index : CLOSED_DROPDOWN_INDEX
        );
      },
    } as IMobileRow;
  });
}

export const mobileHeaders: ICell[] = [
  {
    size: "sm",
    value: "Deposit time",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Status",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: " ",
    cellClassName: "header-cell",
  },
];
