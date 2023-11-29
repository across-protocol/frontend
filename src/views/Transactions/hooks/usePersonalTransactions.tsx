import { useEffect, useState } from "react";

import { useConnection } from "hooks";
import { Deposit, useUserDeposits } from "hooks/useDeposits";

import { usePageSize, useCurrentPage } from "./usePagination";
import { DepositStatusFilter } from "../types";

export function usePersonalTransactions(statusFilter: DepositStatusFilter) {
  const [depositToSpeedUp, setDepositToSpeedUp] = useState<
    Deposit | undefined
  >();

  const { pageSize, handlePageSizeChange } = usePageSize();

  const {
    currentPage,
    setCurrentPage,
    deposits,
    totalDeposits,
    depositsQuery,
  } = usePaginatedUserDeposits(statusFilter, pageSize);

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
    depositToSpeedUp,
    setDepositToSpeedUp,
  };
}

function usePaginatedUserDeposits(
  statusFilter: DepositStatusFilter,
  pageSize: number
) {
  const { account } = useConnection();
  const { currentPage, setCurrentPage } = useCurrentPage();
  const depositsQuery = useUserDeposits(
    statusFilter,
    pageSize,
    currentPage * pageSize,
    account
  );

  return {
    currentPage,
    setCurrentPage,
    depositsQuery,
    deposits: depositsQuery.data?.deposits || [],
    totalDeposits: depositsQuery.data?.pagination?.total || 0,
  };
}
