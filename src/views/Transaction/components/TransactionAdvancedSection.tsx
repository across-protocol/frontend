import { getChainInfo } from "utils/constants";
import { Text } from "components/Text";
import { shortenAddress } from "utils/format";
import { CopyableText } from "./CopyableText";
import { CollapsibleSection } from "./CollapsibleSection";
import { DetailSection } from "./DetailSection";
import { DetailsGrid } from "./TransactionSection.styles";

type TransactionAdvancedSectionProps = {
  deposit: any;
  destinationChainId: number;
  formatUSDValue: (value: string | null) => string;
  formatTimestamp: (timestamp: string | null) => string;
};

export function TransactionAdvancedSection({
  deposit,
  destinationChainId,
  formatUSDValue,
  formatTimestamp,
}: TransactionAdvancedSectionProps) {
  const destinationChain = getChainInfo(destinationChainId);

  return (
    <CollapsibleSection title="Advanced Details" defaultOpen={false}>
      <DetailsGrid>
        <DetailSection label="Deposit Block">
          <Text color="light-200">{deposit.depositBlockNumber}</Text>
        </DetailSection>

        <DetailSection label="Fill Deadline">
          <Text color="light-200">{formatTimestamp(deposit.fillDeadline)}</Text>
        </DetailSection>

        {deposit.exclusivityDeadline && (
          <DetailSection label="Exclusivity Deadline">
            <Text color="light-200">
              {formatTimestamp(deposit.exclusivityDeadline)}
            </Text>
          </DetailSection>
        )}

        <DetailSection label="Relay Hash">
          <CopyableText
            color="light-200"
            textToCopy={deposit.relayHash}
            style={{ wordBreak: "break-all" }}
          >
            {deposit.relayHash}
          </CopyableText>
        </DetailSection>

        <DetailSection label="Message Hash">
          <CopyableText
            color="light-200"
            textToCopy={deposit.messageHash}
            style={{ wordBreak: "break-all" }}
          >
            {deposit.messageHash}
          </CopyableText>
        </DetailSection>

        {deposit.message && deposit.message !== "0x" && (
          <DetailSection label="Message">
            <CopyableText
              color="light-200"
              textToCopy={deposit.message}
              style={{ wordBreak: "break-all" }}
            >
              {deposit.message}
            </CopyableText>
          </DetailSection>
        )}

        {deposit.actionsTargetChainId && (
          <>
            <DetailSection label="Actions Target Chain">
              <Text color="light-200">
                {getChainInfo(parseInt(deposit.actionsTargetChainId)).name}
              </Text>
            </DetailSection>

            <DetailSection label="Actions Succeeded">
              <Text color="light-200">
                {deposit.actionsSucceeded === null
                  ? "Pending"
                  : deposit.actionsSucceeded
                    ? "Yes"
                    : "No"}
              </Text>
            </DetailSection>
          </>
        )}

        {deposit.swapToken && (
          <>
            <DetailSection label="Swap Token">
              <CopyableText
                color="light-200"
                textToCopy={deposit.swapToken}
                explorerLink={`${destinationChain.explorerUrl}/address/${deposit.swapToken}`}
              >
                {shortenAddress(deposit.swapToken, "...", 6)}
              </CopyableText>
            </DetailSection>

            {deposit.swapTokenAmount && (
              <DetailSection label="Swap Token Amount">
                <Text color="light-200">
                  {deposit.swapTokenAmount}{" "}
                  <Text color="grey-400" size="sm">
                    (
                    {formatUSDValue(
                      deposit.swapTokenPriceUsd && deposit.swapTokenAmount
                        ? String(
                            parseFloat(deposit.swapTokenPriceUsd) *
                              parseFloat(deposit.swapTokenAmount)
                          )
                        : null
                    )}
                    )
                  </Text>
                </Text>
              </DetailSection>
            )}
          </>
        )}

        {deposit.fillGasTokenPriceUsd && (
          <DetailSection label="Gas Token Price (USD)">
            <Text color="light-200">
              {formatUSDValue(deposit.fillGasTokenPriceUsd)}
            </Text>
          </DetailSection>
        )}
      </DetailsGrid>
    </CollapsibleSection>
  );
}
