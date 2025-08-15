import styled from "@emotion/styled";
import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";
import { getChainInfo, shortenString } from "utils";

type Props = {
  deposit: Deposit;
  width: number;
};

export function TxCell({ deposit, width }: Props) {
  const fillTxRow = deposit.fillTx ? (
    <DepositTxWrapper>
      <Text color="grey-400">Fill:</Text>
      <ExplorerLink
        chainId={deposit.destinationChainId}
        txHash={deposit.fillTx}
      >
        <Text color="light-200">{shortenString(deposit.fillTx, "..", 4)}</Text>
      </ExplorerLink>
    </DepositTxWrapper>
  ) : null;
  const refundTxRow = deposit.depositRefundTxHash ? (
    <DepositTxWrapper>
      <Text color="grey-400">Refund:</Text>
      <ExplorerLink
        chainId={deposit.sourceChainId}
        txHash={deposit.depositRefundTxHash}
      >
        <Text color="light-200">
          {shortenString(deposit.depositRefundTxHash, "..", 4)}
        </Text>
      </ExplorerLink>
    </DepositTxWrapper>
  ) : null;

  return (
    <StyledTxCell width={width}>
      <DepositTxWrapper>
        <Text color="grey-400">Deposit:</Text>
        <ExplorerLink
          chainId={deposit.sourceChainId}
          txHash={deposit.depositTxHash}
        >
          <Text color="light-200">
            {shortenString(deposit.depositTxHash, "..", 4)}
          </Text>
        </ExplorerLink>
      </DepositTxWrapper>
      {fillTxRow}
      {refundTxRow}
    </StyledTxCell>
  );
}

function ExplorerLink({
  txHash,
  chainId,
  children,
}: {
  txHash: string;
  chainId: number;
  children: React.ReactNode;
}) {
  const explorerUrl = getChainInfo(chainId).constructExplorerLink(txHash);

  return (
    <ExplorerLinkWrapper href={explorerUrl} target="_blank" rel="noreferrer">
      {children}
    </ExplorerLinkWrapper>
  );
}

const StyledTxCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const DepositTxWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
`;

const ExplorerLinkWrapper = styled.a`
  text-decoration: none;
`;
