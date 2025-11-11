import { useHistory } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import styled from "@emotion/styled";

import { PaginatedDepositsTable } from "components/DepositsTable";
import { Text } from "components/Text";
import { SecondaryButton } from "components";
import { Input, InputGroup } from "components/Input";
import { EmptyTable } from "./EmptyTable";
import { DepositStatusFilter } from "../types";
import { useTransactions } from "../hooks/useTransactions";
import { useStreamingDeposits } from "../hooks/useStreamingDeposits";
import { convertIndexerDepositToDeposit } from "../utils/convertDeposit";

const LIVE_REFETCH_INTERVAL = 5000; // 5 seconds

type Props = {
  statusFilter: DepositStatusFilter;
};

export function AllTransactions({ statusFilter }: Props) {
  const [walletAddressFilter, setWalletAddressFilter] = useState<string>("");
  const [isLiveMode, setIsLiveMode] = useState(true);

  const {
    currentPage,
    pageSize,
    setCurrentPage,
    handlePageSizeChange,
    deposits,
    totalDeposits,
    depositsQuery,
  } = useTransactions(statusFilter, walletAddressFilter.trim() || undefined);

  const history = useHistory();
  const queryClient = useQueryClient();

  const isFirstPage = currentPage === 0;
  const liveToggleEnabled = isFirstPage;
  const streamingEnabled = isFirstPage && isLiveMode;
  const streamedDeposits = useStreamingDeposits(
    deposits,
    pageSize,
    streamingEnabled
  );

  // Disable live mode when navigating away from first page
  useEffect(() => {
    if (!isFirstPage) {
      setIsLiveMode(false);
    }
  }, [isFirstPage]);

  // Periodic refetch when live mode is enabled
  useEffect(() => {
    if (!streamingEnabled || depositsQuery.isLoading) {
      return;
    }

    const intervalId = setInterval(() => {
      console.log("refetching");
      depositsQuery.refetch();
    }, LIVE_REFETCH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [streamingEnabled, depositsQuery]);

  const convertedDeposits = useMemo(
    () =>
      streamedDeposits.map((deposit) =>
        convertIndexerDepositToDeposit(deposit)
      ),
    [streamedDeposits]
  );

  if (depositsQuery.isLoading) {
    return (
      <EmptyTable>
        <Text size="lg">Loading...</Text>
      </EmptyTable>
    );
  }

  if (depositsQuery.isError || (currentPage === 0 && deposits.length === 0)) {
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
          <LiveToggleSection disabled={!liveToggleEnabled}>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={isLiveMode}
                onChange={(e) => setIsLiveMode(e.target.checked)}
                disabled={!liveToggleEnabled}
              />
              <ToggleSlider disabled={!liveToggleEnabled} />
            </ToggleSwitch>
            <Text size="sm" color={liveToggleEnabled ? undefined : "grey-400"}>
              Live updates
            </Text>
          </LiveToggleSection>
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
        filterKey={`personal-${statusFilter}`}
        disabledColumns={["bridgeFee", "rewards", "rewardsRate"]}
        displayPageNumbers={false}
      />
    </>
  );
}

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
