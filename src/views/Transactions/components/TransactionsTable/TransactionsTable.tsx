import { useState } from "react";

import { HeadRow, DataRow, MobileDataRow } from "./rows";
import { FillTxInfoModal } from "../FillTxInfoModal";
import { FillTxsListModal } from "../FillTxsListModal";
import { SpeedUpModal } from "../SpeedUpModal";
import { doPartialFillsExist } from "../../utils";

import { TxLink, SupportedTxTuple } from "../../types";

import {
  TableWrapper,
  TableBody,
  Wrapper,
  MobileWrapper,
  Title,
  EmptyRow,
} from "./TransactionsTable.styles";

export type Props = {
  transferTuples: SupportedTxTuple[];
  title: string;
  enablePartialFillInfoIcon?: boolean;
  isMobile?: boolean;
  enableSpeedUps?: boolean;
};

export function TransactionsTable({
  transferTuples,
  title,
  enablePartialFillInfoIcon = false,
  isMobile = false,
  enableSpeedUps = false,
}: Props) {
  const [fillTxLinks, setFillTxLinks] = useState<TxLink[]>([]);
  const [isPartialFillInfoModalOpen, setIsPartialFillInfoModalOpen] =
    useState(false);
  const [txTupleToSpeedUp, setTxTupleToSpeedUp] = useState<SupportedTxTuple>();

  const [Container, Row] = isMobile
    ? [MobileWrapper, MobileDataRow]
    : [Wrapper, DataRow];

  const showPartialFillInfoIcon =
    enablePartialFillInfoIcon && doPartialFillsExist(transferTuples);

  return (
    <>
      <Container>
        <Title>{title}</Title>
        <TableWrapper>
          <HeadRow
            onClickPartialFillInfoIcon={() =>
              setIsPartialFillInfoModalOpen(true)
            }
            showPartialFillInfoIcon={showPartialFillInfoIcon}
            isMobile={isMobile}
            enableSpeedUp={enableSpeedUps}
          />
          <TableBody>
            {transferTuples.length ? (
              transferTuples.map(([token, transfer]) => (
                <Row
                  key={transfer.depositTxHash}
                  token={token}
                  transfer={transfer}
                  onClickFillTxsCellExpandButton={setFillTxLinks}
                  enableSpeedUp={enableSpeedUps}
                  onClickSpeedUp={setTxTupleToSpeedUp}
                />
              ))
            ) : (
              <EmptyRow>No transactions found.</EmptyRow>
            )}
          </TableBody>
        </TableWrapper>
      </Container>
      <FillTxsListModal
        isOpen={fillTxLinks.length > 0}
        onClose={() => setFillTxLinks([])}
        txLinks={fillTxLinks}
      />
      <FillTxInfoModal
        isOpen={isPartialFillInfoModalOpen}
        onClose={() => setIsPartialFillInfoModalOpen(false)}
      />
      {enableSpeedUps && txTupleToSpeedUp && (
        <SpeedUpModal
          isOpen={!!txTupleToSpeedUp}
          onClose={() => setTxTupleToSpeedUp(undefined)}
          txTuple={txTupleToSpeedUp}
        />
      )}
    </>
  );
}
