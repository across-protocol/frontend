import { useEffect } from "react";
import { useDeposits } from "hooks/useDeposits";

import { useCurrentPage, usePageSize } from "./usePagination";
import { DepositStatusFilter } from "../types";

export function useTransactions(
  statusFilter: DepositStatusFilter,
  userAddress?: string
) {
  const { pageSize, handlePageSizeChange } = usePageSize();

  const {
    currentPage,
    setCurrentPage,
    deposits,
    totalDeposits,
    depositsQuery,
  } = usePaginatedDeposits(statusFilter, pageSize, userAddress);

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, userAddress, setCurrentPage]);

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
  pageSize: number,
  userAddress?: string
) {
  const { currentPage, setCurrentPage } = useCurrentPage();
  const depositsQuery = useDeposits(
    statusFilter,
    pageSize,
    currentPage * pageSize,
    userAddress
  );
  const end = depositsQuery.data
    ? depositsQuery.data!.deposits.length < pageSize
    : false;
  const numberOfDeposits = depositsQuery.data?.deposits.length || 0;
  const totalDeposits = numberOfDeposits + currentPage * pageSize;
  // const end = depositsQuery.data ? depositsQuery.data!.deposits.length < pageSize : false;

  return {
    currentPage,
    setCurrentPage,
    depositsQuery,
    deposits: depositsQuery.data?.deposits || [],
    totalDeposits: end ? totalDeposits : totalDeposits + 1,
  };
}
