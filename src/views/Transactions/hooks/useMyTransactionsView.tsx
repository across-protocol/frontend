import { useConnection } from "hooks";
import useWindowSize from "hooks/useWindowSize";
import { DepositStatus, useUserDeposits } from "hooks/useDeposits";
import { BREAKPOINTS } from "utils";
import { paginate } from "components/Pagination";

import {
  usePageSize,
  useCurrentPage,
  DEFAULT_MAX_NAVIGATION_COUNT,
} from "./usePagination";

export function useMyTransactionsView() {
  const { isConnected, account, connect } = useConnection();

  const { width = 0 } = useWindowSize();
  const isMobile = width < BREAKPOINTS.laptopMin;

  const { pageSize, handlePageSizeChange } = usePageSize();

  const paginatedFillUserDeposits = usePaginatedUserDeposits(
    "filled",
    pageSize
  );
  const paginatedPendingUserDeposits = usePaginatedUserDeposits(
    "pending",
    pageSize
  );

  return {
    connectWallet: connect,
    account,
    paginatedFillUserDeposits,
    paginatedPendingUserDeposits,
    pageSize,
    handlePageSizeChange,
    isConnected,
    isMobile,
  };
}

function usePaginatedUserDeposits(
  depositStatus: DepositStatus,
  pageSize: number
) {
  const { account } = useConnection();
  const { currentPage, handlePageChange } = useCurrentPage();
  const depositsQuery = useUserDeposits(
    depositStatus,
    pageSize,
    currentPage * pageSize,
    account
  );
  const depositsPaginateValues = paginate({
    elementCount: depositsQuery.data?.pagination?.total || 0,
    currentPage,
    maxNavigationCount: DEFAULT_MAX_NAVIGATION_COUNT,
    elementsPerPage: pageSize,
  });

  return {
    currentPage,
    handlePageChange,
    depositsQuery,
    transfers: depositsQuery.data?.deposits || [],
    depositsPaginateValues,
  };
}
