import { DateTime } from "luxon";
import { ethers } from "ethers";
import { TableLogo, TableLink, StyledPlus } from "./TransactionsTable.styles";
import { getConfig, Token } from "utils/config";
import {
  shortenTransactionHash,
  capitalizeFirstLetter,
  formatNumberTwoSigDigits,
} from "utils/format";
import { ICell, IRow } from "components/Table/Table";
import { getChainInfo } from "utils/constants";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history/model";
import { ChainId } from "utils";
import { TxLink } from "../useTransactionsView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
// Will take View Model Transaction as arg
// Example of TX View Model:
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
export default function createTransactionTableJSX(
  transactions: Transfer[],
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>,
  setModalData: React.Dispatch<React.SetStateAction<TxLink[]>>
) {
  const rows = formatTransactionRows(transactions, setOpenModal, setModalData);
  return rows;
}

// Will take a TransactionsArg
function formatTransactionRows(
  transactions: Transfer[],
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>,
  setModalData: React.Dispatch<React.SetStateAction<TxLink[]>>
): IRow[] {
  const config = getConfig();
  const supportedTransactions = transactions.reduce((supported, tx) => {
    try {
      // this can error out if there are transactions with new tokens not added to routes, ie we cant lookup by address
      const token = config.getTokenInfoByAddress(
        tx.sourceChainId,
        tx.assetAddr
      );
      supported.push([token, tx]);
    } catch (err) {
      console.warn("transaction with unknown token", err, tx);
    }
    return supported;
  }, [] as [token: Token, tx: Transfer][]);

  return supportedTransactions.map(([token, tx], index) => {
    const timestamp: ICell = {
      size: "sm",
      value: DateTime.fromSeconds(tx.depositTime).toFormat("d MMM yyyy - t"),
    };

    const status: ICell = {
      size: "xs",
      value: capitalizeFirstLetter(tx.status),
    };

    const fp = tx.filled.mul(100).div(tx.amount);
    const filled: ICell = {
      size: "xs",
      value: `${
        fp.toNumber() > 100 ? "100" : formatNumberTwoSigDigits(fp.toNumber())
      }%`,
    };

    const sourceChainId = tx.sourceChainId as ChainId;
    const fromChainInfo = getChainInfo(sourceChainId);
    const { name: fromChainName, logoURI: fromLogo } = fromChainInfo;

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
    const destinationChainInfo = getChainInfo(destinationChainId);
    const { name: toChainName, logoURI: toLogo } = destinationChainInfo;
    const toChain: ICell = {
      size: "xs",
      value: (
        <>
          <TableLogo src={toLogo} alt={`${toChainName}_logo`} /> {toChainName}
        </>
      ),
    };

    const symbol: ICell = {
      size: "xs",
      value: (
        <>
          <TableLogo src={token?.logoURI} alt={`${token?.name}_logo`} />{" "}
          {token?.name === "Wrapped Ether" ? "WETH" : token?.name}
        </>
      ),
    };

    const amount: ICell = {
      size: "xs",
      value: ethers.utils.formatUnits(tx.amount, token.decimals),
    };

    const txHash: ICell = {
      size: "xs",
      value: (
        <TableLink
          href={getChainInfo(sourceChainId).constructExplorerLink(
            tx.depositTxHash
          )}
          target="_blank"
          rel="noreferrer"
        >
          {shortenTransactionHash(tx.depositTxHash)}
        </TableLink>
      ),
    };

    let filledTableValue = <div>-</div>;
    if (tx.fillTxs.length) {
      const filledTxElements = tx.fillTxs.map((fillTxHash) => {
        return (
          <TableLink
            href={getChainInfo(destinationChainId).constructExplorerLink(
              fillTxHash
            )}
            target="_blank"
            rel="noreferrer"
          >
            {shortenTransactionHash(fillTxHash)}
          </TableLink>
        );
      });

      if (filledTxElements.length > 3) {
        const md = tx.fillTxs.map((x) => {
          return {
            url: getChainInfo(destinationChainId).constructExplorerLink(x),
            text: x,
          };
        });
        filledTableValue = (
          <>
            {filledTxElements
              .map<React.ReactNode>((t, i) => {
                if (i < 3) return t;
                return null;
              })
              .reduce((prev, curr) => [prev, ", ", curr])}
            <StyledPlus
              onClick={() => {
                setOpenModal(true);
                setModalData(md);
              }}
            />
          </>
        );
      }

      if (filledTxElements.length <= 3) {
        filledTableValue = (
          <>
            {filledTxElements
              .map<React.ReactNode>((t) => t)
              .reduce((prev, curr) => [prev, ", ", curr])}
          </>
        );
      }
    }

    const filledTxHashCell: ICell = {
      size: "md",
      value: filledTableValue,
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
        filledTxHashCell,
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
  {
    size: "md",
    value: "Fill tx(s)",
    cellClassName: "header-cell",
  },
];

export function createPendingHeaders(
  onClick: React.MouseEventHandler<SVGSVGElement>,
  ongoingTX: Transfer[]
) {
  const h = [...headers];
  const anyPartialFills = ongoingTX.find((x) => {
    const num = x.filled.toNumber();
    if (num > 0 && num <= 100) return x;
    return null;
  });
  h[2] = {
    size: "xs",
    value: (
      <>
        Filled %{" "}
        {anyPartialFills ? (
          <FontAwesomeIcon
            style={{
              color: "#6CF9D7",
              cursor: "pointer",
            }}
            onClick={onClick}
            icon={faCircleInfo}
          />
        ) : null}
      </>
    ),
    cellClassName: "header-cell",
  };
  return h;
}
