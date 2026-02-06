import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import styled from "@emotion/styled";

import { Text } from "components/Text";
import { SecondaryButton } from "components/Button";
import { COLORS } from "utils/constants";
import { DepositStatusFilter } from "utils/types";
import { DepositsFilters } from "../types";
import { EmptyTable } from "./EmptyTable";
import { LiveToggle } from "./LiveToggle";
import { StatusFilter } from "./StatusFilter";
import { WalletAddressFilter } from "./WalletAddressFilter";
import {
  ChainFilter,
  DepositTypeFilter,
  TextInputFilter,
  NumberRangeFilter,
} from "./filters";
import { useTransfers } from "../hooks/useTransfers";
import { convertIndexerDepositToDeposit } from "../utils/convertDeposit";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useLiveMode } from "../hooks/useLiveMode";
import { PaginatedTransfersTable } from "./DepositsTable";

const LIVE_REFETCH_INTERVAL = 1_000;

export function AllTransfers() {
  const [walletAddressInput, setWalletAddressInput] = useState<string>("");
  const [walletAddressFilter, setWalletAddressFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<DepositStatusFilter>("all");
  const [filters, setFilters] = useState<DepositsFilters>({});

  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();
  const account = accountEVM || accountSVM?.toString();

  const handleSearch = (value: string) => {
    setWalletAddressFilter(value.trim());
  };

  const updateFilter = useCallback(
    <K extends keyof DepositsFilters>(key: K, value: DepositsFilters[K]) => {
      setFilters((prev) => {
        const next = { ...prev };
        if (value === undefined) {
          delete next[key];
        } else {
          next[key] = value;
        }
        return next;
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.keys(filters).length > 0;

  const {
    currentPage,
    pageSize,
    setCurrentPage,
    handlePageSizeChange,
    deposits,
    totalDeposits,
    depositsQuery,
  } = useTransfers(
    walletAddressFilter.trim() || undefined,
    statusFilter,
    filters
  );

  const queryClient = useQueryClient();

  const isFirstPage = currentPage === 0;
  const isAddressFiltering = walletAddressFilter.trim().length > 0;
  const isStatusFiltering = statusFilter !== "all";
  const isFiltering =
    isAddressFiltering || isStatusFiltering || hasActiveFilters;

  const { isLiveMode, setIsLiveMode, isEnabled } = useLiveMode({
    refetchFn: depositsQuery.refetch,
    refetchInterval: LIVE_REFETCH_INTERVAL,
    enabled: isFirstPage && !isFiltering,
    isLoading: depositsQuery.isLoading,
    isFetching: depositsQuery.isFetching,
  });

  const convertedDeposits = useMemo(
    () =>
      deposits.map((deposit) => {
        const converted = convertIndexerDepositToDeposit(deposit);
        return {
          ...converted,
          hideFeeTooLow: !(account === walletAddressFilter),
        };
      }),
    [deposits, account, walletAddressFilter]
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
            return depositsQuery.refetch();
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
          <WalletAddressFilter
            inputValue={walletAddressInput}
            onInputChange={setWalletAddressInput}
            onSearch={handleSearch}
            evmAddress={accountEVM}
            svmAddress={accountSVM?.toString()}
          />
          <RightControls>
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <LiveToggle
              isLiveMode={isLiveMode}
              onToggle={setIsLiveMode}
              disabled={!isEnabled}
            />
          </RightControls>
        </ControlsRow>
        <FiltersRow>
          <ChainFilter
            label="Origin"
            value={filters.originChainId}
            onChange={(v) => updateFilter("originChainId", v)}
          />
          <ChainFilter
            label="Destination"
            value={filters.destinationChainId}
            onChange={(v) => updateFilter("destinationChainId", v)}
          />
          <DepositTypeFilter
            value={filters.depositType}
            onChange={(v) => updateFilter("depositType", v)}
          />
          <TextInputFilter
            label="Depositor"
            value={filters.depositor}
            onChange={(v) => updateFilter("depositor", v)}
            placeholder="0x..."
          />
          <TextInputFilter
            label="Recipient"
            value={filters.recipient}
            onChange={(v) => updateFilter("recipient", v)}
            placeholder="0x..."
          />
          <TextInputFilter
            label="Input Token"
            value={filters.inputToken}
            onChange={(v) => updateFilter("inputToken", v)}
            placeholder="Token address..."
          />
          <TextInputFilter
            label="Output Token"
            value={filters.outputToken}
            onChange={(v) => updateFilter("outputToken", v)}
            placeholder="Token address..."
          />
          <TextInputFilter
            label="Integrator"
            value={filters.integratorId}
            onChange={(v) => updateFilter("integratorId", v)}
            placeholder="Integrator ID..."
          />
          <NumberRangeFilter
            label="Deposit Blocks"
            startValue={filters.startBlock}
            endValue={filters.endBlock}
            onStartChange={(v) => updateFilter("startBlock", v)}
            onEndChange={(v) => updateFilter("endBlock", v)}
          />
          <NumberRangeFilter
            label="Fill Blocks"
            startValue={filters.startFillBlock}
            endValue={filters.endFillBlock}
            onStartChange={(v) => updateFilter("startFillBlock", v)}
            onEndChange={(v) => updateFilter("endFillBlock", v)}
          />
          {hasActiveFilters && (
            <ClearButton onClick={clearFilters}>Clear filters</ClearButton>
          )}
        </FiltersRow>
      </ControlsContainer>
      <PaginatedTransfersTable
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
        isLoading={depositsQuery.isFetching && !isLiveMode}
      />
      {hasNoResults && (
        <EmptyStateMessage>
          <Text size="lg">
            {isFiltering
              ? "No transfers found matching your filters"
              : "No transfers found"}
          </Text>
          {isFiltering && (
            <Text size="sm" color="grey-400" style={{ marginTop: "8px" }}>
              Try adjusting your filters
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
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0 14px;
  height: 40px;
  background: transparent;
  border-radius: 8px;
  border: 1px solid ${COLORS["grey-400"]};
  color: ${COLORS["grey-400"]};
  font-size: 14px;
  font-family: Barlow, sans-serif;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: ${COLORS.white};
    border-color: ${COLORS.white};
  }
`;
