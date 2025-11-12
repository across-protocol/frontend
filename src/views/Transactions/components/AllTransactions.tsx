import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import styled from "@emotion/styled";

import { PaginatedDepositsTable } from "components/DepositsTable";
import { Text } from "components/Text";
import { SecondaryButton } from "components";
import { Input, InputGroup } from "components/Input";
import { COLORS } from "utils";
import { EmptyTable } from "./EmptyTable";
import { LiveToggle } from "./LiveToggle";
import { useTransactions } from "../hooks/useTransactions";
import { useStreamingDeposits } from "../hooks/useStreamingDeposits";
import { useLiveMode } from "../hooks/useLiveMode";
import { convertIndexerDepositToDeposit } from "../utils/convertDeposit";

const LIVE_REFETCH_INTERVAL = 5000;

export function AllTransactions() {
  const [walletAddressFilter, setWalletAddressFilter] = useState<string>("");

  const {
    currentPage,
    pageSize,
    setCurrentPage,
    handlePageSizeChange,
    deposits,
    totalDeposits,
    depositsQuery,
  } = useTransactions(walletAddressFilter.trim() || undefined);

  const queryClient = useQueryClient();

  const isFirstPage = currentPage === 0;
  const isFiltering = walletAddressFilter.trim().length > 0;

  const { isLiveMode, setIsLiveMode, isEnabled } = useLiveMode({
    refetchFn: depositsQuery.refetch,
    refetchInterval: LIVE_REFETCH_INTERVAL,
    enabled: isFirstPage && !isFiltering,
    isLoading: depositsQuery.isLoading,
  });

  const streamingEnabled = isFirstPage && isLiveMode && !isFiltering;
  const streamedDeposits = useStreamingDeposits(
    deposits,
    pageSize,
    streamingEnabled
  );

  const convertedDeposits = useMemo(
    () =>
      streamedDeposits.map((deposit) => {
        const converted = convertIndexerDepositToDeposit(deposit);
        // Show "processing" instead of "fee too low" on all transactions page
        return { ...converted, hideFeeTooLow: true };
      }),
    [streamedDeposits]
  );

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
          <LiveToggle
            isLiveMode={isLiveMode}
            onToggle={setIsLiveMode}
            disabled={!isEnabled}
            disabledReason={isFiltering ? "filtering" : "not-first-page"}
          />
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
