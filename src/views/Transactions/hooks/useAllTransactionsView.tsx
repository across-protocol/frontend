import useWindowSize from "hooks/useWindowsSize";
import { DepositStatus, useDeposits } from "hooks/useDeposits";
import { BREAKPOINTS } from "utils";
import { paginate } from "components/Pagination";

import {
  usePageSize,
  useCurrentPage,
  DEFAULT_MAX_NAVIGATION_COUNT,
} from "./usePagination";
import { formatToTransfer } from "../utils";

export function useAllTransactionsView() {
  const { width = 0 } = useWindowSize();
  const isMobile = width < BREAKPOINTS.laptopMin;

  const { pageSize, handlePageSizeChange } = usePageSize();

  const paginatedFillDeposits = usePaginatedDeposits("filled", pageSize);
  const paginatedPendingDeposits = usePaginatedDeposits("pending", pageSize);

  return {
    isMobile,
    paginatedFillDeposits,
    paginatedPendingDeposits,
    handlePageSizeChange,
    pageSize,
  };
}

function usePaginatedDeposits(depositStatus: DepositStatus, pageSize: number) {
  const { currentPage, handlePageChange } = useCurrentPage();
  const depositsQuery = useDeposits(
    depositStatus,
    pageSize,
    currentPage * pageSize
  );
  const depositsPaginateValues = paginate({
    elementCount: depositsQuery.pagination?.total || 0,
    currentPage,
    maxNavigationCount: DEFAULT_MAX_NAVIGATION_COUNT,
    elementsPerPage: pageSize,
  });

  const transfers = depositsQuery.deposits.map(formatToTransfer);

  return {
    currentPage,
    handlePageChange,
    depositsQuery,
    transfers,
    depositsPaginateValues,
  };
}
