import { DateTime } from "luxon";
import { ethers } from "ethers";
import {
  TableLogo,
  MobileTableLink,
  MobileChevron,
  TableLink,
} from "./TransactionsTable.styles";
import {
  capitalizeFirstLetter,
  formatNumberTwoSigDigits,
  shortenString,
  formatUnits,
} from "utils/format";
import { ICell, IRow } from "components/Table/Table";
import { getChainInfo, ChainId } from "utils/constants";
import { getConfig, Token } from "utils/config";
import { CLOSED_DROPDOWN_INDEX, TxLink } from "../useTransactionsView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history/model";

export interface IMobileRow extends IRow {
  toChain: React.ReactElement;
  fromChain: React.ReactElement;
  symbol: React.ReactElement;
  amount: string;
  txHash: React.ReactElement;
  onClick?: () => void;
  filledTableValue: JSX.Element;
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
  setOpenIndex: React.Dispatch<React.SetStateAction<number>>,
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>,
  setModalData: React.Dispatch<React.SetStateAction<TxLink[]>>
) {
  return formatTransactionRows(
    transactions,
    setOpenIndex,
    setOpenModal,
    setModalData
  );
}

// Will take a TransactionsArg
function formatTransactionRows(
  transactions: Transfer[],
  setOpenIndex: React.Dispatch<React.SetStateAction<number>>,
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>,
  setModalData: React.Dispatch<React.SetStateAction<TxLink[]>>
): IMobileRow[] {
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
      size: "md",
      value: DateTime.fromSeconds(tx.depositTime).toFormat("d MMM yyyy - t"),
    };

    const status: ICell = {
      size: "sm",
      value: capitalizeFirstLetter(tx.status),
    };

    const fp = tx.filled.mul(100).div(tx.amount);
    const filled: ICell = {
      size: "sm",
      value: `${
        fp.toNumber() > 100 ? "100" : formatNumberTwoSigDigits(fp.toNumber())
      }%`,
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

    const symbol = (
      <>
        <TableLogo src={token?.logoURI} alt={`${token?.name}_logo`} />{" "}
        {token?.name === "Wrapped Ether" ? "WETH" : token?.name}
      </>
    );

    const amount = formatUnits(tx.amount, token.decimals).toString();

    const txHash = (
      <MobileTableLink
        href={getChainInfo(sourceChainId).constructExplorerLink(
          tx.depositTxHash
        )}
        target="_blank"
        rel="noreferrer"
      >
        {shortenString(tx.depositTxHash, "...", 8)}
      </MobileTableLink>
    );

    let filledTableValue = <div>-</div>;
    if (tx.fillTxs.length) {
      const filledTxElements = tx.fillTxs.map((fillTxHash) => {
        return (
          <div>
            <TableLink
              href={getChainInfo(destinationChainId).constructExplorerLink(
                fillTxHash
              )}
              target="_blank"
              rel="noreferrer"
            >
              {shortenString(fillTxHash, "...", 8)}
            </TableLink>
          </div>
        );
      });

      filledTableValue = <>{filledTxElements}</>;
    }

    return {
      cells: [timestamp, status, filled, downChevron],
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
      filledTableValue,
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
    size: "sm",
    value: "Filled %",
    cellClassName: "header-cell",
  },
  {
    size: "xs",
    value: " ",
    cellClassName: "header-cell",
  },
];

export function createPendingMobileHeaders(
  onClick: React.MouseEventHandler<SVGSVGElement>,
  ongoingTX: Transfer[]
) {
  const mh = [...mobileHeaders];
  const anyPartialFills = ongoingTX.find((x) => {
    const num = x.filled.toNumber();
    if (num > 0 && num <= 100) return x;
    return null;
  });
  mh[2] = {
    size: "sm",
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

  return mh;
}
