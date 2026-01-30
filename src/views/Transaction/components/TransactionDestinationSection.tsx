import { getChainInfo } from "utils/constants";
import { getConfig } from "utils/config";
import { Text } from "components/Text";
import { formatUnitsWithMaxFractions, shortenAddress } from "utils/format";
import { CopyableAddress } from "./CopyableAddress";
import { CopyableText } from "./CopyableText";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-up-right-boxed.svg";
import {
  SectionCard,
  SectionHeader,
  ChainBadge,
  ChainIcon,
  HeaderRight,
  ExplorerLinkButton,
  DetailRowGroup,
  DetailRowItem,
  TokenDisplay,
  TokenIcon,
} from "./TransactionSection.styles";

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
          <Text color="light-200" size="md" weight={600}>
            {destinationChain.name}
          </Text>
        </ChainBadge>
        <HeaderRight>
          <span>Destination</span>
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

      <DetailRowGroup>
        <DetailRowItem>
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
        </DetailRowItem>

        <DetailRowItem>
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
        </DetailRowItem>
      </DetailRowGroup>

      <DetailRowGroup>
        <DetailRowItem>
          <Text color="grey-400" size="md">
            Recipient
          </Text>
          <CopyableAddress
            color="light-200"
            address={deposit.recipient}
            explorerLink={`${destinationChain.explorerUrl}/address/${deposit.recipient}`}
          />
        </DetailRowItem>

        {deposit.relayer && (
          <DetailRowItem>
            <Text color="grey-400" size="md">
              Relayer
            </Text>
            <CopyableAddress
              color="light-200"
              address={deposit.relayer}
              explorerLink={`${destinationChain.explorerUrl}/address/${deposit.relayer}`}
            />
          </DetailRowItem>
        )}

        {deposit.exclusiveRelayer &&
          deposit.exclusiveRelayer !==
            "0x0000000000000000000000000000000000000000" && (
            <DetailRowItem>
              <Text color="grey-400" size="md">
                Exclusive Relayer
              </Text>
              <CopyableAddress
                color="light-200"
                address={deposit.exclusiveRelayer}
                explorerLink={`${destinationChain.explorerUrl}/address/${deposit.exclusiveRelayer}`}
              />
            </DetailRowItem>
          )}

        {deposit.fillTx && (
          <DetailRowItem>
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
          </DetailRowItem>
        )}

        {deposit.swapTransactionHash && (
          <DetailRowItem>
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
          </DetailRowItem>
        )}
      </DetailRowGroup>

      {deposit.fillBlockTimestamp && (
        <DetailRowGroup>
          <DetailRowItem>
            <Text color="grey-400" size="md">
              Fill time
            </Text>
            <Text color="light-200" size="md">
              {formatTimestamp(deposit.fillBlockTimestamp)}
            </Text>
          </DetailRowItem>
        </DetailRowGroup>
      )}
    </SectionCard>
  );
}
