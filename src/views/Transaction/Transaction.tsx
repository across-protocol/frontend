import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import {
  COLORS,
  getChainInfo,
  getNativeTokenSymbol,
  getToken,
  QUERIESV2,
} from "utils";
import { Text } from "components/Text";
import { LayoutV2 } from "components";
import { ReactComponent as ArrowIcon } from "assets/icons/chevron-down.svg";
import { useDepositByTxHash } from "hooks/useDepositStatus";
import { CenteredMessage } from "./components/CenteredMessage";
import { StatusBadge } from "./components/StatusBadge";
import { TransactionSourceSection } from "./components/TransactionSourceSection";
import { TransactionDestinationSection } from "./components/TransactionDestinationSection";
import { TransactionFeeSection } from "./components/TransactionFeeSection";
import { TransactionAdvancedSection } from "./components/TransactionAdvancedSection";
import { formatUnits } from "ethers/lib/utils";

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

  const sourceChainId = parseInt(deposit.originChainId);
  const destinationChainId = parseInt(deposit.destinationChainId);
  const sourceChain = getChainInfo(sourceChainId);
  const destinationChain = getChainInfo(destinationChainId);

  const fillDuration = calculateFillDuration(
    deposit.depositBlockTimestamp,
    deposit.fillBlockTimestamp
  );

  const fillGasFeeScaled = (() => {
    try {
      return deposit.fillGasFee
        ? formatUnits(
            deposit.fillGasFee,
            getToken(getNativeTokenSymbol(destinationChainId)).decimals
          )
        : null;
    } catch (e) {
      console.error(
        `Failed to scale fill gas fee for tx ${deposit.depositTxnRef}`
      );
      return null;
    }
  })();

  return (
    <LayoutV2 maxWidth={1140}>
      <Wrapper>
        <BreadcrumbWrapper>
          <BreadcrumbContent>
            <BreadcrumbLink to="/transactions">
              <BreadcrumbLinkText size="lg">Transfers</BreadcrumbLinkText>
            </BreadcrumbLink>
            <StyledArrowIcon />
            <CurrentPageText size="lg">Transfer Details</CurrentPageText>
          </BreadcrumbContent>
          <BreadcrumbDivider />
        </BreadcrumbWrapper>
        <InnerSectionWrapper>
          <HeaderBar>
            <StatusBadge status={deposit.status} />
            <FillTimeText>
              <Text color="grey-400" size="md">
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
            fillGasFee={fillGasFeeScaled}
            fillGasFeeUsd={deposit.fillGasFeeUsd}
            swapFeeUsd={deposit.swapFeeUsd}
            formatUSDValue={formatUSDValue}
          />

          <TransactionAdvancedSection
            deposit={deposit}
            destinationChainId={destinationChainId}
            formatUSDValue={formatUSDValue}
            formatTimestamp={formatTimestamp}
          />
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
  padding: 0;
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
  padding: 0;
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
  padding: 0;
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

const HeaderBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
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
