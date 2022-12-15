import { Zap } from "react-feather";
import { ChainId, Token, shortenTransactionHash, getChainInfo } from "utils";
import { Deposit } from "hooks/useDeposits";

import {
  ChainCell,
  FilledPercentageCell,
  TimestampCell,
  StatusCell,
  SymbolCell,
  AmountCell,
} from "../cells";
import {
  TableLink,
  TableRow,
  TableCell,
  StyledPlus,
  SpeedUpCell,
} from "../TransactionsTable.styles";
import { SupportedTxTuple, TxLink } from "../../../types";

type Props = {
  transfer: Deposit;
  token: Token;
  onClickFillTxsCellExpandButton: (fillTxLinks: TxLink[]) => void;
  enableSpeedUp?: boolean;
  onClickSpeedUp?: (tuple: SupportedTxTuple) => void;
};

export function DataRow({
  transfer,
  onClickFillTxsCellExpandButton,
  token,
  enableSpeedUp,
  onClickSpeedUp,
}: Props) {
  return (
    <TableRow>
      <TimestampCell timestamp={transfer.depositTime} />
      <StatusCell
        status={transfer.status}
        currentRelayerFeePct={transfer.depositRelayerFeePct}
        suggestedRelayerFeePct={transfer.suggestedRelayerFeePct}
        enableSpeedUp={enableSpeedUp}
      />
      <FilledPercentageCell filled={transfer.filled} amount={transfer.amount} />
      <ChainCell chainId={transfer.sourceChainId as ChainId} />
      <ChainCell chainId={transfer.destinationChainId as ChainId} />
      <SymbolCell token={token} />
      <AmountCell amount={transfer.amount} decimals={token.decimals} />
      <TableCell>
        <TableLink
          href={getChainInfo(transfer.sourceChainId).constructExplorerLink(
            transfer.depositTxHash
          )}
          target="_blank"
          rel="noreferrer"
        >
          {shortenTransactionHash(transfer.depositTxHash)}
        </TableLink>
      </TableCell>
      <FillTxsCell
        fillTxs={transfer.fillTxs}
        destinationChainId={transfer.destinationChainId}
        onClickExpandButton={onClickFillTxsCellExpandButton}
      />
      {enableSpeedUp && (
        <SpeedUpCell
          id="speed-up-cell"
          onClick={() => onClickSpeedUp && onClickSpeedUp([token, transfer])}
        >
          <Zap />
        </SpeedUpCell>
      )}
    </TableRow>
  );
}

function FillTxsCell(props: {
  fillTxs: string[];
  destinationChainId: ChainId;
  onClickExpandButton: (fillTxLinks: TxLink[]) => void;
  maxNumDisplayableFillTxs?: number;
}) {
  const totalNumFillTxs = props.fillTxs.length;
  const maxNumDisplayableFillTxs = props.maxNumDisplayableFillTxs || 1;
  const fillTxLinks = props.fillTxs.map((x) => {
    return {
      url: getChainInfo(props.destinationChainId).constructExplorerLink(x),
      text: x,
    };
  });

  let cellContent = <div>-</div>;

  if (totalNumFillTxs) {
    const slicedFillTxLinks = props.fillTxs
      .map<React.ReactNode>((fillTxHash) => {
        return (
          <TableLink
            key={fillTxHash}
            href={getChainInfo(props.destinationChainId).constructExplorerLink(
              fillTxHash
            )}
            target="_blank"
            rel="noreferrer"
          >
            {shortenTransactionHash(fillTxHash)}
          </TableLink>
        );
      })
      .slice(0, maxNumDisplayableFillTxs)
      .reduce((prev, curr) => [prev, ", ", curr]);

    cellContent = (
      <>
        {slicedFillTxLinks}
        {totalNumFillTxs > maxNumDisplayableFillTxs ? (
          <StyledPlus onClick={() => props.onClickExpandButton(fillTxLinks)} />
        ) : null}
      </>
    );
  }

  return <TableCell>{cellContent}</TableCell>;
}
