import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history";

import {
  FilledPercentageCell,
  StatusCell,
  TimestampCell,
  ChainCell,
  SymbolCell,
  AmountCell,
} from "../cells";
import { getChainInfo, shortenString, Token } from "utils";

import {
  MobileTableRow,
  MobileCell,
  MobileChevron,
  MobileTableLink,
  AccordionWrapper,
  AccordionRow,
  TableLink,
} from "../TransactionsTable.styles";

type Props = {
  transfer: Transfer;
  token: Token;
};

export function MobileDataRow({ transfer, token }: Props) {
  const [isAccordionOpen, setIsAccordionOpen] = React.useState(false);

  const toggleAccordion = React.useCallback(() => {
    setIsAccordionOpen((prevState) => !prevState);
  }, []);

  return (
    <>
      <MobileTableRow onClick={toggleAccordion}>
        <TimestampCell timestamp={transfer.depositTime} />
        <StatusCell status={transfer.status} />
        <FilledPercentageCell
          filled={transfer.filled}
          amount={transfer.amount}
        />
        <ToggleAccordionCell isOpen={isAccordionOpen} />
      </MobileTableRow>
      {isAccordionOpen && (
        <AccordionWrapper>
          <AccordionRow>
            <div>Source</div>
            <ChainCell chainId={transfer.sourceChainId} />
          </AccordionRow>
          <AccordionRow>
            <div>Destination</div>
            <ChainCell chainId={transfer.destinationChainId} />
          </AccordionRow>
          <AccordionRow>
            <div>Asset</div>
            <SymbolCell token={token} />
          </AccordionRow>
          <AccordionRow>
            <div>Amount</div>
            <AmountCell amount={transfer.amount} decimals={token.decimals} />
          </AccordionRow>
          <AccordionRow>
            <div>Deposit tx</div>
            <div>
              <MobileTableLink
                href={getChainInfo(
                  transfer.sourceChainId
                ).constructExplorerLink(transfer.depositTxHash)}
                target="_blank"
                rel="noreferrer"
              >
                {shortenString(transfer.depositTxHash, "...", 8)}
              </MobileTableLink>
            </div>
          </AccordionRow>
          <AccordionRow>
            <div>Fill tx(s)</div>
            <MobileFillTxsCell
              fillTxs={transfer.fillTxs}
              destinationChainId={transfer.destinationChainId}
            />
          </AccordionRow>
        </AccordionWrapper>
      )}
    </>
  );
}

function MobileFillTxsCell(props: {
  fillTxs: string[];
  destinationChainId: number;
}) {
  if (!props.fillTxs.length) {
    return <div>-</div>;
  }

  return (
    <>
      {props.fillTxs.map((fillTxHash) => {
        return (
          <div>
            <TableLink
              href={getChainInfo(
                props.destinationChainId
              ).constructExplorerLink(fillTxHash)}
              target="_blank"
              rel="noreferrer"
            >
              {shortenString(fillTxHash, "...", 8)}
            </TableLink>
          </div>
        );
      })}
    </>
  );
}

function ToggleAccordionCell(props: { isOpen: boolean }) {
  return (
    <MobileCell>
      <MobileChevron>
        <FontAwesomeIcon icon={props.isOpen ? faChevronUp : faChevronDown} />
      </MobileChevron>
    </MobileCell>
  );
}
