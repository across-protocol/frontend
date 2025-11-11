import { useHistory } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useRef } from "react";
import styled from "@emotion/styled";

import { PaginatedDepositsTable } from "components/DepositsTable";
import { Text } from "components/Text";
import { SecondaryButton } from "components";
import { Input, InputGroup } from "components/Input";
import { Tooltip } from "components/Tooltip";
import { COLORS } from "utils";
import { EmptyTable } from "./EmptyTable";
import { useTransactions } from "../hooks/useTransactions";
import { useStreamingDeposits } from "../hooks/useStreamingDeposits";
import { convertIndexerDepositToDeposit } from "../utils/convertDeposit";

const LIVE_REFETCH_INTERVAL = 5000; // 5 seconds

export function AllTransactions() {
  const [walletAddressFilter, setWalletAddressFilter] = useState<string>("");
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const isRefetchingRef = useRef(false);

  const {
    currentPage,
    pageSize,
    setCurrentPage,
    handlePageSizeChange,
    deposits,
    totalDeposits,
    depositsQuery,
  } = useTransactions(walletAddressFilter.trim() || undefined);

  const history = useHistory();
  const queryClient = useQueryClient();

  const isFirstPage = currentPage === 0;
  const isFiltering = walletAddressFilter.trim().length > 0;
  const liveToggleEnabled = isFirstPage && !isFiltering;
  const streamingEnabled = isFirstPage && isLiveMode && !isFiltering;
  const streamedDeposits = useStreamingDeposits(
    deposits,
    pageSize,
    streamingEnabled
  );

  // Disable live mode when navigating away from first page or when filtering
  useEffect(() => {
    if (!isFirstPage || isFiltering) {
      setIsLiveMode(false);
    }
  }, [isFirstPage, isFiltering]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      // Refetch when page becomes visible again
      if (isVisible && streamingEnabled && !depositsQuery.isLoading) {
        console.log("Page became visible, refetching deposits");
        depositsQuery.refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [streamingEnabled, depositsQuery]);

  // Periodic refetch when live mode is enabled and page is visible
  useEffect(() => {
    const shouldRefetch =
      streamingEnabled && isPageVisible && !depositsQuery.isLoading;

    if (!shouldRefetch) {
      if (isRefetchingRef.current) {
        console.log("[Transactions] ⏹️  Stopping auto-refetch");
        isRefetchingRef.current = false;
      }
      return;
    }

    if (!isRefetchingRef.current) {
      console.log(
        `[Transactions] 🔄 Starting auto-refetch every ${LIVE_REFETCH_INTERVAL / 1000}s`
      );
      isRefetchingRef.current = true;
    }

    const intervalId = setInterval(() => {
      console.log(
        `[Transactions] 📡 Fetching new deposits (interval: ${LIVE_REFETCH_INTERVAL / 1000}s)`
      );
      depositsQuery.refetch();
    }, LIVE_REFETCH_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [streamingEnabled, isPageVisible, depositsQuery]);

  const convertedDeposits = useMemo(
    () =>
      streamedDeposits.map((deposit) => {
        const converted = convertIndexerDepositToDeposit(deposit);
        // Show "processing" instead of "fee too low" on all transactions page
        return { ...converted, hideFeeTooLow: true };
      }),
    [streamedDeposits]
  );

  // Log when new data arrives from refetch
  useEffect(() => {
    if (depositsQuery.data && streamingEnabled) {
      console.log(
        `[Transactions] ✅ Fetch complete: received ${deposits.length} deposits from API`
      );
    }
  }, [depositsQuery.data, deposits.length, streamingEnabled]);

  if (depositsQuery.isLoading) {
    return (
      <EmptyTable>
        <Text size="lg">Loading...</Text>
      </EmptyTable>
    );
  }

  if (depositsQuery.isError) {
    return (
      <EmptyTable>
        <Text size="lg">Something went wrong... Please try again later</Text>
        <SecondaryButton
          size="md"
          onClick={async () => {
            await queryClient.cancelQueries({ queryKey: ["deposits"] });
            await queryClient.resetQueries({ queryKey: ["deposits"] });
            depositsQuery.refetch();
          }}
        >
          Reload data
        </SecondaryButton>
      </EmptyTable>
    );
  }

  const hasNoResults = currentPage === 0 && deposits.length === 0;

  return (
    <>
      <ControlsContainer>
        <ControlsRow>
          <FilterSection>
            <FilterLabel>
              <Text size="sm" color="grey-400">
                Filter by wallet address
              </Text>
            </FilterLabel>
            <FilterInputWrapper>
              <InputGroup validationLevel="valid">
                <Input
                  type="text"
                  placeholder="0x..."
                  value={walletAddressFilter}
                  onChange={(e) => setWalletAddressFilter(e.target.value)}
                  validationLevel="valid"
                />
              </InputGroup>
            </FilterInputWrapper>
          </FilterSection>
          {!liveToggleEnabled ? (
            <Tooltip
              tooltipId="live-toggle-disabled"
              title={
                isFiltering
                  ? "Live updates disabled during filtering"
                  : "Live updates only available on first page"
              }
              body={
                <Text size="sm">
                  {isFiltering
                    ? "Clear the wallet address filter to enable live updates"
                    : "Navigate to the first page to enable live updates"}
                </Text>
              }
              placement="bottom"
            >
              <LiveToggleSection disabled={true}>
                <ToggleSwitch>
                  <ToggleInput
                    type="checkbox"
                    checked={isLiveMode}
                    onChange={(e) => setIsLiveMode(e.target.checked)}
                    disabled={true}
                  />
                  <ToggleSlider disabled={true} />
                </ToggleSwitch>
                <Text size="sm" color="grey-400">
                  Live updates
                </Text>
              </LiveToggleSection>
            </Tooltip>
          ) : (
            <LiveToggleSection disabled={false}>
              <ToggleSwitch>
                <ToggleInput
                  type="checkbox"
                  checked={isLiveMode}
                  onChange={(e) => setIsLiveMode(e.target.checked)}
                  disabled={false}
                />
                <ToggleSlider disabled={false} />
              </ToggleSwitch>
              <Text size="sm">Live updates</Text>
            </LiveToggleSection>
          )}
        </ControlsRow>
      </ControlsContainer>
      <PaginatedDepositsTable
        currentPage={currentPage}
        currentPageSize={pageSize}
        deposits={convertedDeposits}
        totalCount={totalDeposits}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        initialPageSize={pageSize}
        disabledColumns={[
          "date",
          "bridgeFee",
          "rewards",
          "rewardsRate",
          "actions",
        ]}
        displayPageNumbers={false}
        hasNoResults={hasNoResults}
      />
      {hasNoResults && (
        <EmptyStateMessage>
          <Text size="lg">
            {isFiltering
              ? "No transactions found for this address"
              : "No transactions found"}
          </Text>
          {isFiltering && (
            <Text size="sm" color="grey-400" style={{ marginTop: "8px" }}>
              Try a different wallet address
            </Text>
          )}
        </EmptyStateMessage>
      )}
    </>
  );
}

const EmptyStateMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  border: 1px solid ${COLORS["grey-600"]};
  border-top: none;
  border-radius: 0 0 12px 12px;
  background: ${COLORS["grey-600"]};
`;

const ControlsContainer = styled.div`
  margin-bottom: 20px;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const LiveToggleSection = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(62, 64, 71, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "default")};

  &:hover {
    background: ${({ disabled }) =>
      disabled ? "rgba(62, 64, 71, 0.3)" : "rgba(62, 64, 71, 0.5)"};
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #6cf9d8;
  }

  &:checked + span:before {
    transform: translateX(16px);
  }

  &:disabled + span {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ToggleSlider = styled.span<{ disabled?: boolean }>`
  position: absolute;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #3e4047;
  transition: 0.3s;
  border-radius: 20px;

  &:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 240px;
`;

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  padding-left: 2px;
`;

const FilterInputWrapper = styled.div`
  max-width: 400px;
  width: 100%;
`;
