import { COLORS, getChainInfo } from "utils/constants";
import { getConfig } from "utils/config";
import { Text } from "components/Text";
import {
  calculateUsdValue,
  formatUnitsWithMaxFractions,
  shortenAddress,
} from "utils/format";
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
          <Text color="light-200" size="md" weight={600}>
            {sourceChain.name}
          </Text>
        </ChainBadge>
        <HeaderRight>
          <span>Source</span>
          <ExplorerLinkButton
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            title="View on explorer"
          >
            <ExternalLinkIcon color={COLORS["base-bright-gray"]} />
          </ExplorerLinkButton>
        </HeaderRight>
      </SectionHeader>

      <DetailRowGroup>
        <DetailRowItem>
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
        </DetailRowItem>

        <DetailRowItem>
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
              {formatUSDValue(
                inputToken
                  ? calculateUsdValue(
                      deposit.inputAmount,
                      inputToken.decimals,
                      deposit.inputPriceUsd
                    )
                  : null
              )}
            </Text>
          </div>
        </DetailRowItem>
      </DetailRowGroup>

      <DetailRowGroup>
        <DetailRowItem>
          <Text color="grey-400" size="md">
            Depositor
          </Text>
          <CopyableAddress
            color="light-200"
            address={deposit.depositor}
            explorerLink={`${sourceChain.explorerUrl}/address/${deposit.depositor}`}
          />
        </DetailRowItem>
        <DetailRowItem>
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
        </DetailRowItem>
      </DetailRowGroup>

      <DetailRowGroup>
        <DetailRowItem>
          <Text color="grey-400" size="md">
            Deposit time
          </Text>
          <Text color="light-200" size="md">
            {formatTimestamp(deposit.depositBlockTimestamp)}
          </Text>
        </DetailRowItem>

        <DetailRowItem>
          <Text color="grey-400" size="md">
            Quote time
          </Text>
          <Text color="light-200" size="md">
            {formatTimestamp(deposit.quoteTimestamp)}
          </Text>
        </DetailRowItem>
      </DetailRowGroup>
    </SectionCard>
  );
}
