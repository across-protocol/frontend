import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import styled from "@emotion/styled";

import { Text } from "components/Text";
import { SecondaryButton } from "components/Button";
import { COLORS } from "utils/constants";
import { DepositStatusFilter } from "utils/types";
import { EmptyTable } from "./EmptyTable";
import { LiveToggle } from "./LiveToggle";
import { StatusFilter } from "./StatusFilter";
import { WalletAddressFilter } from "./WalletAddressFilter";
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

  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();
  const account = accountEVM || accountSVM?.toString();

  const handleSearch = (value: string) => {
    setWalletAddressFilter(value.trim());
  };

  const {
    currentPage,
    pageSize,
    setCurrentPage,
    handlePageSizeChange,
    deposits,
    totalDeposits,
    depositsQuery,
  } = useTransfers(walletAddressFilter.trim() || undefined, statusFilter);

  const queryClient = useQueryClient();

  const isFirstPage = currentPage === 0;
  const isAddressFiltering = walletAddressFilter.trim().length > 0;
  const isStatusFiltering = statusFilter !== "all";
  const isFiltering = isAddressFiltering || isStatusFiltering;

  const { isLiveMode, setIsLiveMode, isEnabled } = useLiveMode({
    refetchFn: depositsQuery.refetch,
    refetchInterval: LIVE_REFETCH_INTERVAL,
    enabled: isFirstPage,
    isLoading: depositsQuery.isLoading,
    isFetching: depositsQuery.isFetching,
  });

  const convertedDeposits = useMemo(
    () =>
      deposits.map((deposit) => {
        const converted = convertIndexerDepositToDeposit(deposit);
        // Show "processing" instead of "fee too low" on all transactions page
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
