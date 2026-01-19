import { useState } from "react";

import { getTxHistoryPageSize, setTxHistoryPageSize } from "utils/localStorage";

const DEFAULT_TX_HISTORY_PAGE_SIZE = 10;

export function useCurrentPage() {
  const [currentPage, setCurrentPage] = useState(0);

  return {
    currentPage,
    setCurrentPage,
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
