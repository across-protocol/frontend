import styled from "@emotion/styled";

import Pagination, { paginate } from "components/Pagination";
import { DepositsTable, Props as DepositsTableProps } from "./DepositsTable";

type Props = DepositsTableProps & {
  currentPage: number;
  onPageChange: (newPage: number) => void;
  currentPageSize: number;
  onPageSizeChange: (newPageSize: number) => void;
  totalCount: number;
  initialPageSize?: number;
  pageSizes?: number[];
};

const DEFAULT_PAGE_SIZES = [10, 25, 50];

export function PaginatedDepositsTable({
  currentPage,
  onPageChange,
  currentPageSize,
  onPageSizeChange,
  totalCount,
  initialPageSize = DEFAULT_PAGE_SIZES[0],
  pageSizes = DEFAULT_PAGE_SIZES,
  ...depositsTableProps
}: Props) {
  const paginateValues = paginate({
    elementCount: totalCount,
    currentPage,
    maxNavigationCount: 5,
    elementsPerPage: currentPageSize,
  });

  return (
    <>
      <DepositsTable {...depositsTableProps} />
      <PaginationWrapper>
        <Pagination
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageList={paginateValues.pageList}
          activeIndex={paginateValues.activeIndex}
          disableBack={paginateValues.disableBack}
          disableForward={paginateValues.disableForward}
          hideStart={paginateValues.hideStart}
          hideEnd={paginateValues.hideEnd}
          lastPage={paginateValues.lastPage}
          currentPage={currentPage}
          pageSize={currentPageSize}
          pageSizes={pageSizes}
        />
      </PaginationWrapper>
    </>
  );
}

const PaginationWrapper = styled.div``;
