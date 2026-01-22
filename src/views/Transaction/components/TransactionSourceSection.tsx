import styled from "@emotion/styled";
import { COLORS, getChainInfo, getConfig, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import { formatUnitsWithMaxFractions, shortenAddress } from "utils/format";
import { CopyableAddress } from "./CopyableAddress";
import { CopyableText } from "./CopyableText";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-up-right-boxed.svg";

type TransactionSourceSectionProps = {
  deposit: any;
  sourceChainId: number;
  formatUSDValue: (value: string | null) => string;
  formatTimestamp: (timestamp: string | null) => string;
  explorerLink: string;
};

export function TransactionSourceSection({
  deposit,
  sourceChainId,
  formatUSDValue,
  formatTimestamp,
  explorerLink,
}: TransactionSourceSectionProps) {
  const config = getConfig();
  const sourceChain = getChainInfo(sourceChainId);
  const inputToken = config.getTokenInfoByAddressSafe(
    sourceChainId,
    deposit.inputToken
  );

  return (
    <SectionCard>
      <SectionHeader>
        <ChainBadge>
          <ChainIcon src={sourceChain.logoURI} alt={sourceChain.name} />
          <Text color="light-200" size="lg" weight={500}>
            {sourceChain.name}
          </Text>
        </ChainBadge>
        <HeaderRight>
          <Text color="grey-400" size="sm">
            Source
          </Text>
          <ExplorerLinkButton
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            title="View on explorer"
          >
            <ExternalLinkIcon />
          </ExplorerLinkButton>
        </HeaderRight>
      </SectionHeader>

      <Divider />

      <DetailRow>
        <Text color="grey-400" size="md">
          Token
        </Text>
        <TokenDisplay>
          {inputToken && (
            <TokenIcon src={inputToken.logoURI} alt={inputToken.symbol} />
          )}
          <Text color="light-200" size="md">
            {inputToken?.symbol}
          </Text>
        </TokenDisplay>
      </DetailRow>

      <DetailRow>
        <Text color="grey-400" size="md">
          Amount
        </Text>
        <div>
          <Text color="light-200" size="md">
            {inputToken
              ? formatUnitsWithMaxFractions(
                  deposit.inputAmount,
                  inputToken.decimals
                )
              : deposit.inputAmount}{" "}
            {inputToken?.symbol}
          </Text>
          <Text color="grey-400" size="sm">
            {" "}
            {formatUSDValue(deposit.inputPriceUsd)}
          </Text>
        </div>
      </DetailRow>

      <Divider />

      <DetailRow>
        <Text color="grey-400" size="md">
          Depositor
        </Text>
        <CopyableAddress
          color="light-200"
          address={deposit.depositor}
          explorerLink={`${sourceChain.explorerUrl}/address/${deposit.depositor}`}
        />
      </DetailRow>

      <DetailRow>
        <Text color="grey-400" size="md">
          Transaction
        </Text>
        <CopyableText
          color="light-200"
          textToCopy={deposit.depositTxnRef}
          explorerLink={sourceChain.constructExplorerLink(
            deposit.depositTxnRef
          )}
        >
          {shortenAddress(deposit.depositTxnRef, "...", 6)}
        </CopyableText>
      </DetailRow>

      <Divider />

      <DetailRow>
        <Text color="grey-400" size="md">
          Deposit time
        </Text>
        <Text color="light-200" size="md">
          {formatTimestamp(deposit.depositBlockTimestamp)}
        </Text>
      </DetailRow>

      <DetailRow>
        <Text color="grey-400" size="md">
          Quote time
        </Text>
        <Text color="light-200" size="md">
          {formatTimestamp(deposit.quoteTimestamp)}
        </Text>
      </DetailRow>
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
