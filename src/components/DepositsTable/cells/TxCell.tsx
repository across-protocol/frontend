import styled from "@emotion/styled";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { ReactComponent as ArrowDownIcon } from "assets/icons/arrow-16.svg";
import { ReactComponent as ArrowExternalLink } from "assets/icons/external-link-16.svg";
import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";
import { COLORS, getChainInfo, shortenAddress, shortenString } from "utils";

type Props = {
  deposit: Deposit;
  width: number;
};

export function TxCell({ deposit, width }: Props) {
  const fillTxRow =
    deposit.fillTxs.length === 0 ? null : deposit.fillTxs.length === 1 ? (
      <DepositTxWrapper>
        <Text color="grey-400">Fill:</Text>
        <ExplorerLink
          chainId={deposit.destinationChainId}
          txHash={deposit.fillTxs[0]}
        >
          <Text color="light-200">
            {shortenString(deposit.fillTxs[0], "..", 4)}
          </Text>
        </ExplorerLink>
      </DepositTxWrapper>
    ) : (
      <FillTxDropdownMenu deposit={deposit} />
    );

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
    </StyledTxCell>
  );
}

function FillTxDropdownMenu({ deposit }: { deposit: Deposit }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <FillTxWrapper>
          <Text color="grey-400">Fill:</Text>
          <Text color="light-200">
            {shortenString(deposit.fillTxs[0], "..", 4)}
          </Text>
          <Text color="grey-400">+{deposit.fillTxs.length - 1}</Text>
          {isOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </FillTxWrapper>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom">
        {deposit.fillTxs.map((txHash) => (
          <ExplorerLink
            key={txHash}
            chainId={deposit.destinationChainId}
            txHash={txHash}
          >
            <DropdownMenuItem>
              <DropdownMenuItemContentLeft>
                <Text color="grey-400">Fill</Text>
                <Text color="light-200">
                  {shortenAddress(deposit.depositTxHash, ". .", 4)}
                </Text>
              </DropdownMenuItemContentLeft>
              <ArrowExternalLink />
            </DropdownMenuItem>
          </ExplorerLink>
        ))}
      </DropdownMenuContent>
    </DropdownMenu.Root>
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

const FillTxWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
`;

const ArrowUpIcon = styled(ArrowDownIcon)`
  transform: rotate(180deg);
`;

const ExplorerLinkWrapper = styled.a`
  text-decoration: none;
`;

const DropdownMenuTrigger = styled(DropdownMenu.Trigger)`
  cursor: pointer;
`;

const DropdownMenuContent = styled(DropdownMenu.Content)`
  display: flex;
  width: 240px;
  flex-direction: column;

  border-radius: 10px;
  border: 1px solid ${COLORS["black-700"]};
  background: ${COLORS["black-900"]};
  box-shadow: 0px 16px 32px 0px rgba(0, 0, 0, 0.2);
`;

const DropdownMenuItem = styled(DropdownMenu.Item)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  border: none;

  &:hover {
    background: ${COLORS["black-800"]};
  }

  > svg {
    height: 16px;
    width: 16px;
  }
`;

const DropdownMenuItemContentLeft = styled.div`
  display: flex;
  flex-direction: column;
`;
