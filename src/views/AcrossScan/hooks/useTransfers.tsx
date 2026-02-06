import { useEffect } from "react";
import { useDeposits } from "hooks/useDeposits";
import { DepositStatusFilter } from "utils/types";

import { useCurrentPage, usePageSize } from "./usePagination";

export function useTransfers(
  userAddress?: string,
  statusFilter: DepositStatusFilter = "all"
) {
  const { pageSize, handlePageSizeChange } = usePageSize();

  const {
    currentPage,
    setCurrentPage,
    deposits,
    totalDeposits,
    depositsQuery,
  } = usePaginatedTransfers(pageSize, userAddress, statusFilter);

  useEffect(() => {
    setCurrentPage(0);
  }, [userAddress, statusFilter, setCurrentPage]);

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
  statusFilter: DepositStatusFilter = "all"
) {
  const { currentPage, setCurrentPage } = useCurrentPage();
  const depositsQuery = useDeposits(
    pageSize,
    currentPage * pageSize,
    userAddress,
    statusFilter
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
