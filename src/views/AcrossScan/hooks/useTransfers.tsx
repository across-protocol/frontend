import { useEffect } from "react";
import { useDeposits } from "hooks/useDeposits";
import { DepositStatusFilter } from "utils/types";

import { DepositsFilters } from "../types";
import { useCurrentPage, usePageSize } from "./usePagination";

export function useTransfers(
  userAddress?: string,
  statusFilter: DepositStatusFilter = "all",
  filters: DepositsFilters = {}
) {
  const { pageSize, handlePageSizeChange } = usePageSize();

  const {
    currentPage,
    setCurrentPage,
    deposits,
    totalDeposits,
    depositsQuery,
  } = usePaginatedTransfers(pageSize, userAddress, statusFilter, filters);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    setCurrentPage(0);
  }, [userAddress, statusFilter, filtersKey, setCurrentPage]);

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

function usePaginatedTransfers(
  pageSize: number,
  userAddress?: string,
  statusFilter: DepositStatusFilter = "all",
  filters: DepositsFilters = {}
) {
  const { currentPage, setCurrentPage } = useCurrentPage();
  const depositsQuery = useDeposits(
    pageSize,
    currentPage * pageSize,
    userAddress,
    statusFilter,
    filters
  );
  const end = depositsQuery.data
    ? depositsQuery.data.deposits.length < pageSize
    : false;
  const numberOfDeposits = depositsQuery.data?.deposits.length || 0;
  const totalDeposits = numberOfDeposits + currentPage * pageSize;

  return {
    currentPage,
    setCurrentPage,
    depositsQuery,
    deposits: depositsQuery.data?.deposits || [],
    totalDeposits: end ? totalDeposits : totalDeposits + 1,
  };
}
