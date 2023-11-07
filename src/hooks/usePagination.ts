import { useState } from "react";

import { paginate } from "components/Pagination";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_MAX_NAVIGATION_COUNT = 5;

export function usePagination(
  totalCount: number,
  options: Partial<{
    maxNavigationCount: number;
    initialPageSize: number;
  }> = {}
) {
  const { maxNavigationCount = DEFAULT_MAX_NAVIGATION_COUNT, initialPageSize } =
    options;

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(
    initialPageSize || DEFAULT_PAGE_SIZE
  );

  const paginateValues = paginate({
    elementCount: totalCount,
    currentPage,
    maxNavigationCount,
    elementsPerPage: pageSize,
  });

  return {
    paginateValues,
    currentPage,
    setPageSize,
    setCurrentPage,
    pageSize,
  };
}
