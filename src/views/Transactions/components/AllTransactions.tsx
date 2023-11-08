import { PaginatedDepositsTable } from "components/DepositsTable";
import { Text } from "components/Text";
import { SecondaryButton } from "components";

import { EmptyTable } from "./EmptyTable";
import { useAllTransactions } from "../hooks/useAllTransactions";
import { DepositStatusFilter } from "../types";

type Props = {
  statusFilter: DepositStatusFilter;
};

export function AllTransactions({ statusFilter }: Props) {
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    handlePageSizeChange,
    deposits,
    totalDeposits,
    depositsQuery,
  } = useAllTransactions(statusFilter);

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
        <Text size="lg">Something went wrong... Please try again later.</Text>
        <SecondaryButton size="md" onClick={() => depositsQuery.refetch()}>
          Reload data
        </SecondaryButton>
      </EmptyTable>
    );
  }

  if (deposits.length === 0) {
    return (
      <EmptyTable>
        <Text size="lg">No indexed transactions found</Text>
      </EmptyTable>
    );
  }

  return (
    <PaginatedDepositsTable
      currentPage={currentPage}
      currentPageSize={pageSize}
      deposits={deposits}
      totalCount={totalDeposits}
      onPageChange={setCurrentPage}
      onPageSizeChange={handlePageSizeChange}
      initialPageSize={pageSize}
      disabledColumns={["loyaltyRate", "rewards", "actions"]}
    />
  );
}
