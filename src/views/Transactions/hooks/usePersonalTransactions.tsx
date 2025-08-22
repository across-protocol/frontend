import { useEffect, useState } from "react";

import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
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
  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();
  const account = accountEVM || accountSVM;
  const { currentPage, setCurrentPage } = useCurrentPage();
  const depositsQuery = useUserDeposits(
    statusFilter,
    pageSize,
    currentPage * pageSize,
    account as string
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
