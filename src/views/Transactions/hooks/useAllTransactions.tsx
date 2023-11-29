import { useEffect } from "react";

import { useDeposits } from "hooks/useDeposits";

import { useCurrentPage, usePageSize } from "./usePagination";
import { DepositStatusFilter } from "../types";

export function useAllTransactions(statusFilter: DepositStatusFilter) {
  const { pageSize, handlePageSizeChange } = usePageSize();

  const {
    currentPage,
    setCurrentPage,
    deposits,
    totalDeposits,
    depositsQuery,
  } = usePaginatedDeposits(statusFilter, pageSize);

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, setCurrentPage]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    handlePageSizeChange,
    deposits,
    totalDeposits,
    depositsQuery,
  };
}

function usePaginatedDeposits(
  statusFilter: DepositStatusFilter,
  pageSize: number
) {
  const { currentPage, setCurrentPage } = useCurrentPage();
  const depositsQuery = useDeposits(
    statusFilter,
    pageSize,
    currentPage * pageSize
  );

  return {
    currentPage,
    setCurrentPage,
    depositsQuery,
    deposits: depositsQuery.data?.deposits || [],
    totalDeposits: depositsQuery.data?.pagination?.total || 0,
  };
}
