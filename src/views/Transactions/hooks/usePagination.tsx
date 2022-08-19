import { useState } from "react";

import { paginate } from "components/Pagination";
import { getTxHistoryPageSize, setTxHistoryPageSize } from "utils/localStorage";

const DEFAULT_TX_HISTORY_PAGE_SIZE = 10;
export const DEFAULT_MAX_NAVIGATION_COUNT = 5;

export function usePagination(
  totalCount: number,
  options: Partial<{
    maxNavigationCount: number;
  }> = {}
) {
  const { maxNavigationCount = DEFAULT_MAX_NAVIGATION_COUNT } = options;

  const { currentPage, handlePageChange } = useCurrentPage();
  const { pageSize, handlePageSizeChange } = usePageSize();

  const paginateValues = paginate({
    elementCount: totalCount,
    currentPage,
    maxNavigationCount,
    elementsPerPage: pageSize,
  });

  return {
    paginateValues,
    currentPage,
    handlePageSizeChange,
    handlePageChange,
    pageSize,
  };
}

export function useCurrentPage() {
  const [currentPage, setCurrentPage] = useState(0);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return {
    currentPage,
    handlePageChange,
  };
}

export function usePageSize() {
  const [pageSize, setPageSize] = useState(
    () => getTxHistoryPageSize() || DEFAULT_TX_HISTORY_PAGE_SIZE
  );

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setTxHistoryPageSize(newPageSize);
  };

  return { pageSize, handlePageSizeChange };
}
