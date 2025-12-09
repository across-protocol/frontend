import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { COLORS, getChainInfo, getConfig, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import { LayoutV2 } from "components";
import { ReactComponent as ArrowIcon } from "assets/icons/chevron-down.svg";
import { useDepositByTxHash } from "hooks/useDepositStatus";
import { CenteredMessage } from "./components/CenteredMessage";
import { DetailSection } from "./components/DetailSection";
import { StatusBadge } from "./components/StatusBadge";
import { CopyableText } from "./components/CopyableText";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { formatUnitsWithMaxFractions, shortenAddress } from "utils/format";
import { TransactionSourceSection } from "./components/TransactionSourceSection";
import { TransactionDestinationSection } from "./components/TransactionDestinationSection";
import { TransactionFeeSection } from "./components/TransactionFeeSection";

const LOADING_DELAY_MS = 400;

// Helper function to format USD string values
function formatUSDValue(value: string | null): string {
  if (!value || value === "0") return "$0.00";
  const num = parseFloat(value);
  if (isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

// Helper function to format timestamps
function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return "N/A";
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
}

function calculateFillDuration(
  depositTimestamp: string | null,
  fillTimestamp: string | null
): { formatted: string; isPending: boolean } {
  if (!depositTimestamp) {
    return { formatted: "N/A", isPending: false };
  }

  const depositTime = new Date(depositTimestamp).getTime();

  if (!fillTimestamp) {
    const elapsedMs = Date.now() - depositTime;
    const elapsedSeconds = elapsedMs / 1000;

    if (elapsedSeconds < 60) {
      return {
        formatted: `${elapsedSeconds.toFixed(1)}s elapsed`,
        isPending: true,
      };
    } else if (elapsedSeconds < 3600) {
      const minutes = Math.floor(elapsedSeconds / 60);
      return {
        formatted: `${minutes}m ${Math.floor(elapsedSeconds % 60)}s elapsed`,
        isPending: true,
      };
    } else {
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      return {
        formatted: `${hours}h ${minutes}m elapsed`,
        isPending: true,
      };
    }
  }

  const fillTime = new Date(fillTimestamp).getTime();
  const durationMs = fillTime - depositTime;

  if (durationMs < 1000) {
    return { formatted: `${durationMs}ms`, isPending: false };
  } else if (durationMs < 60000) {
    return {
      formatted: `${(durationMs / 1000).toFixed(3)}s`,
      isPending: false,
    };
  } else {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return {
      formatted: `${minutes}m ${remainingSeconds}s`,
      isPending: false,
    };
  }
}

export default function Transaction() {
  const { depositTxnRef } = useParams<{ depositTxnRef: string }>();
  const {
    data: depositData,
    isLoading,
    error,
  } = useDepositByTxHash(depositTxnRef);

  const [showLoading, setShowLoading] = useState(false);

  // Delay showing loading state to avoid flash for fast loads
  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(true);
    }, LOADING_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (showLoading) return <CenteredMessage title="Loading transaction..." />;
  if (error)
    return (
      <CenteredMessage
        title="Error loading transaction"
        error={String(error)}
      />
    );
  if (!depositData) {
    // If we have no data and not loading, it means the transaction wasn't found
    if (!isLoading) {
      return <CenteredMessage title="Transaction not found" />;
    }
    // Still loading but within the delay period, show nothing yet
    return null;
  }

  const deposit = depositData.deposit;
  const config = getConfig();

  const sourceChainId = parseInt(deposit.originChainId);
  const destinationChainId = parseInt(deposit.destinationChainId);
  const sourceChain = getChainInfo(sourceChainId);
  const destinationChain = getChainInfo(destinationChainId);

  const inputToken = config.getTokenInfoByAddressSafe(
    sourceChainId,
    deposit.inputToken
  );
  const outputToken = config.getTokenInfoByAddressSafe(
    destinationChainId,
    deposit.outputToken
  );

  const fillDuration = calculateFillDuration(
    deposit.depositBlockTimestamp,
    deposit.fillBlockTimestamp
  );

  return (
    <LayoutV2 maxWidth={1140}>
      <Wrapper>
        <BreadcrumbWrapper>
          <BreadcrumbContent>
            <BreadcrumbLink to="/transactions">
              <BreadcrumbLinkText size="lg">Transactions</BreadcrumbLinkText>
            </BreadcrumbLink>
            <StyledArrowIcon />
            <CurrentPageText size="lg">Transaction Details</CurrentPageText>
          </BreadcrumbContent>
          <BreadcrumbDivider />
        </BreadcrumbWrapper>
        <InnerSectionWrapper>
          <HeaderBar>
            <StatusBadge status={deposit.status} />
            <FillTimeText>
              <Text color="grey-400" size="sm">
                {fillDuration.isPending ? "Time Elapsed:" : "Fill Time:"}
              </Text>
              <Text
                color={fillDuration.isPending ? "yellow" : "aqua"}
                size="lg"
                weight={600}
              >
                {fillDuration.formatted}
              </Text>
            </FillTimeText>
          </HeaderBar>

          <TwoColumnGrid>
            <TransactionSourceSection
              deposit={deposit}
              sourceChainId={sourceChainId}
              formatUSDValue={formatUSDValue}
              formatTimestamp={formatTimestamp}
              explorerLink={sourceChain.constructExplorerLink(
                deposit.depositTxnRef
              )}
            />
            <TransactionDestinationSection
              deposit={deposit}
              destinationChainId={destinationChainId}
              formatUSDValue={formatUSDValue}
              formatTimestamp={formatTimestamp}
              explorerLink={
                deposit.fillTx
                  ? destinationChain.constructExplorerLink(deposit.fillTx)
                  : undefined
              }
            />
          </TwoColumnGrid>

          <TransactionFeeSection
            bridgeFeeUsd={deposit.bridgeFeeUsd}
            fillGasFee={deposit.fillGasFee}
            fillGasFeeUsd={deposit.fillGasFeeUsd}
            swapFeeUsd={deposit.swapFeeUsd}
            formatUSDValue={formatUSDValue}
          />

          <CollapsibleSection title="Advanced Details" defaultOpen={false}>
            <DetailsGrid>
              <DetailSection label="Deposit Block">
                <Text color="light-200">{deposit.depositBlockNumber}</Text>
              </DetailSection>

              <DetailSection label="Fill Deadline">
                <Text color="light-200">
                  {formatTimestamp(deposit.fillDeadline)}
                </Text>
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
                      {
                        getChainInfo(parseInt(deposit.actionsTargetChainId))
                          .name
                      }
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
        </InnerSectionWrapper>
      </Wrapper>
    </LayoutV2>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  max-width: 1140px;
  width: 100%;

  margin: 0 auto;
  padding: 32px 0;

  @media ${QUERIESV2.sm.andDown} {
    padding: 16px 0;
    gap: 16px;
  }
`;

const InnerSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 24px;

  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    gap: 16px;
  }
`;

const BreadcrumbWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
  width: 100%;
`;

const BreadcrumbDivider = styled.div`
  background: #34353b;
  height: 1px;
  width: 100%;
`;

const BreadcrumbContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

const BreadcrumbLink = styled(Link)`
  color: #9daab2;
  text-transform: capitalize;
  text-decoration: none;
`;

const BreadcrumbLinkText = styled(Text)`
  color: #9daab2;
  text-transform: capitalize;
`;

const CurrentPageText = styled(Text)`
  color: #e0f3ff;
  text-transform: capitalize;
`;

const StyledArrowIcon = styled(ArrowIcon)`
  rotate: -90deg;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  width: 100%;
  padding: 24px;
  background: ${COLORS["grey-600"]};
  border-radius: 12px;
  border: 1px solid ${COLORS["grey-500"]};

  @media ${QUERIESV2.sm.andDown} {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 16px;
  }
`;

const HeaderBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 16px;
  background: ${COLORS["black-800"]};
  border-radius: 16px;
  border: 1px solid ${COLORS["grey-600"]};
  gap: 16px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const FillTimeText = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    grid-template-columns: 1fr;
  }
`;
