import { useEffect } from "react";
import { useDeposits } from "hooks/useDeposits";

import { useCurrentPage, usePageSize } from "./usePagination";

export function useTransactions(userAddress?: string) {
  const { pageSize, handlePageSizeChange } = usePageSize();

  const {
    currentPage,
    setCurrentPage,
    deposits,
    totalDeposits,
    depositsQuery,
  } = usePaginatedDeposits(pageSize, userAddress);

  useEffect(() => {
    setCurrentPage(0);
  }, [userAddress, setCurrentPage]);

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

function usePaginatedDeposits(pageSize: number, userAddress?: string) {
  const { currentPage, setCurrentPage } = useCurrentPage();
  const depositsQuery = useDeposits(
    pageSize,
    currentPage * pageSize,
    userAddress
  );
  const end = depositsQuery.data
    ? depositsQuery.data!.deposits.length < pageSize
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
