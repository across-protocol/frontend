import { DateTime } from "luxon";
import { ethers } from "ethers";
import {
  TableLogo,
  MobileTableLink,
  MobileChevron,
} from "./TransactionsTable.styles";
import { shortenTransactionHash, capitalizeFirstLetter } from "utils/format";
import { ICell, IRow } from "components/Table/Table";
import { getChainInfo, ChainId } from "utils/constants";
import { getConfig } from "utils/config";
import { CLOSED_DROPDOWN_INDEX } from "../useTransactionsView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history/model";

export interface IMobileRow extends IRow {
  toChain: React.ReactElement;
  fromChain: React.ReactElement;
  symbol: React.ReactElement;
  amount: string;
  txHash: React.ReactElement;
  onClick?: () => void;
}

/*  
Transfer:
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
export default function createMobileTransactionTableJSX(
  transactions: Transfer[],
  setOpenIndex: React.Dispatch<React.SetStateAction<number>>
) {
  return formatTransactionRows(transactions, setOpenIndex);
}

// Will take a TransactionsArg
function formatTransactionRows(
  transactions: Transfer[],
  setOpenIndex: React.Dispatch<React.SetStateAction<number>>
): IMobileRow[] {
  const config = getConfig();

  return transactions.map((tx, index) => {
    const timestamp: ICell = {
      size: "md",
      value: DateTime.fromSeconds(tx.depositTime).toFormat("d MMM yyyy - t"),
    };

    const status: ICell = {
      size: "sm",
      value: capitalizeFirstLetter(tx.status),
    };

    const downChevron: ICell = {
      size: "xs",
      value: (
        <MobileChevron>
          <FontAwesomeIcon icon={faChevronDown} />
        </MobileChevron>
      ),
    };

    const sourceChainId = tx.sourceChainId as ChainId;
    const fromChainInfo = getChainInfo(sourceChainId);
    const { name: fromChainName, logoURI: fromLogo } = fromChainInfo;
    const fromChain = (
      <>
        <TableLogo src={fromLogo} alt={`${fromChainName}_logo`} />{" "}
        {fromChainName}
      </>
    );

    const destinationChainId = tx.destinationChainId as ChainId;
    const destinationChainInfo = getChainInfo(destinationChainId);
    const { name: toChainName, logoURI: toLogo } = destinationChainInfo;
    const toChain = (
      <>
        <TableLogo src={toLogo} alt={`${toChainName}_logo`} /> {toChainName}
      </>
    );

    const token = config.getTokenInfoByAddress(sourceChainId, tx.assetAddr);

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
        href={getChainInfo(sourceChainId).constructExplorerLink(
          tx.depositTxHash
        )}
        target="_blank"
        rel="noreferrer"
      >
        {shortenTransactionHash(tx.depositTxHash)}
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
