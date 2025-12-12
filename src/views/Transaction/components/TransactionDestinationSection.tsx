import styled from "@emotion/styled";
import { COLORS, getChainInfo, getConfig, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import { formatUnitsWithMaxFractions, shortenAddress } from "utils/format";
import { CopyableAddress } from "./CopyableAddress";
import { CopyableText } from "./CopyableText";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-up-right-boxed.svg";

type TransactionDestinationSectionProps = {
  deposit: any;
  destinationChainId: number;
  formatUSDValue: (value: string | null) => string;
  formatTimestamp: (timestamp: string | null) => string;
  explorerLink?: string;
};

export function TransactionDestinationSection({
  deposit,
  destinationChainId,
  formatUSDValue,
  formatTimestamp,
  explorerLink,
}: TransactionDestinationSectionProps) {
  const config = getConfig();
  const destinationChain = getChainInfo(destinationChainId);
  const outputToken = config.getTokenInfoByAddressSafe(
    destinationChainId,
    deposit.outputToken
  );

  return (
    <SectionCard>
      <SectionHeader>
        <ChainBadge>
          <ChainIcon
            src={destinationChain.logoURI}
            alt={destinationChain.name}
          />
          <Text color="light-200" size="lg" weight={500}>
            {destinationChain.name}
          </Text>
        </ChainBadge>
        <HeaderRight>
          <Text color="grey-400" size="sm">
            Destination
          </Text>
          {explorerLink && (
            <ExplorerLinkButton
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              title="View on explorer"
            >
              <ExternalLinkIcon />
            </ExplorerLinkButton>
          )}
        </HeaderRight>
      </SectionHeader>

      <Divider />

      <DetailRow>
        <Text color="grey-400" size="md">
          Token
        </Text>
        <TokenDisplay>
          {outputToken && (
            <TokenIcon src={outputToken.logoURI} alt={outputToken.symbol} />
          )}
          <Text color="light-200" size="md">
            {outputToken?.symbol}
          </Text>
        </TokenDisplay>
      </DetailRow>

      <DetailRow>
        <Text color="grey-400" size="md">
          Amount
        </Text>
        <div>
          <Text color="light-200" size="md">
            {outputToken
              ? formatUnitsWithMaxFractions(
                  deposit.outputAmount,
                  outputToken.decimals
                )
              : deposit.outputAmount}{" "}
            {outputToken?.symbol}
          </Text>
          <Text color="grey-400" size="sm">
            {" "}
            {formatUSDValue(deposit.outputPriceUsd)}
          </Text>
        </div>
      </DetailRow>

      <Divider />

      <DetailRow>
        <Text color="grey-400" size="md">
          Recipient
        </Text>
        <CopyableAddress
          color="light-200"
          address={deposit.recipient}
          explorerLink={`${destinationChain.explorerUrl}/address/${deposit.recipient}`}
        />
      </DetailRow>

      {deposit.relayer && (
        <DetailRow>
          <Text color="grey-400" size="md">
            Relayer
          </Text>
          <CopyableAddress
            color="light-200"
            address={deposit.relayer}
            explorerLink={`${destinationChain.explorerUrl}/address/${deposit.relayer}`}
          />
        </DetailRow>
      )}

      {deposit.exclusiveRelayer &&
        deposit.exclusiveRelayer !==
          "0x0000000000000000000000000000000000000000" && (
          <DetailRow>
            <Text color="grey-400" size="md">
              Exclusive Relayer
            </Text>
            <CopyableAddress
              color="light-200"
              address={deposit.exclusiveRelayer}
              explorerLink={`${destinationChain.explorerUrl}/address/${deposit.exclusiveRelayer}`}
            />
          </DetailRow>
        )}

      {deposit.fillTx && (
        <DetailRow>
          <Text color="grey-400" size="md">
            Transaction
          </Text>
          <CopyableText
            color="light-200"
            textToCopy={deposit.fillTx}
            explorerLink={destinationChain.constructExplorerLink(
              deposit.fillTx
            )}
          >
            {shortenAddress(deposit.fillTx, "...", 6)}
          </CopyableText>
        </DetailRow>
      )}

      {deposit.swapTransactionHash && (
        <DetailRow>
          <Text color="grey-400" size="md">
            Swap Transaction
          </Text>
          <CopyableText
            color="light-200"
            textToCopy={deposit.swapTransactionHash}
            explorerLink={
              deposit.actionsTargetChainId
                ? getChainInfo(
                    parseInt(deposit.actionsTargetChainId)
                  ).constructExplorerLink(deposit.swapTransactionHash)
                : "#"
            }
          >
            {shortenAddress(deposit.swapTransactionHash, "...", 6)}
          </CopyableText>
        </DetailRow>
      )}

      {deposit.fillBlockTimestamp && (
        <>
          <Divider />
          <DetailRow>
            <Text color="grey-400" size="md">
              Fill time
            </Text>
            <Text color="light-200" size="md">
              {formatTimestamp(deposit.fillBlockTimestamp)}
            </Text>
          </DetailRow>
        </>
      )}
    </SectionCard>
  );
}

const SectionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: ${COLORS["black-800"]};
  border-radius: 16px;
  border: 1px solid ${COLORS["grey-600"]};
  width: 100%;
`;

const SectionHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const HeaderRight = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const ChainBadge = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const ExplorerLinkButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
    path {
      stroke: ${COLORS["grey-400"]};
      transition: stroke 0.2s ease;
    }
  }

  &:hover {
    background: ${COLORS["grey-600"]};
    svg path {
      stroke: ${COLORS.aqua};
    }
  }
`;

const ChainIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

const TokenIcon = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 50%;
`;

const TokenDisplay = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const DetailRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${COLORS["grey-600"]};
`;
