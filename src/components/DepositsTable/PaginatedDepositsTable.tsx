import styled from "@emotion/styled";

import Pagination from "components/Pagination";
import { usePagination } from "hooks/usePagination";
import { DepositsTable, Props as DepositsTableProps } from "./DepositsTable";

type Props = DepositsTableProps & {
  onPageChange: (currentPage: number) => void;
  onPageSizeChange: (currentPageSize: number) => void;
  totalCount: number;
  initialPageSize?: number;
  pageSizes?: number[];
};

const DEFAULT_PAGE_SIZES = [10, 25, 50];

export function PaginatedDepositsTable({
  onPageChange,
  onPageSizeChange,
  totalCount,
  initialPageSize = DEFAULT_PAGE_SIZES[0],
  pageSizes = DEFAULT_PAGE_SIZES,
  ...depositsTableProps
}: Props) {
  const { pageSize, currentPage, setCurrentPage, setPageSize, paginateValues } =
    usePagination(totalCount, { initialPageSize });

  return (
    <>
      <DepositsTable {...depositsTableProps} />
      <PaginationWrapper>
        <Pagination
          onPageChange={(newPage) => {
            setCurrentPage(newPage);
            onPageChange(newPage);
          }}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            onPageSizeChange(newPageSize);
          }}
          pageList={paginateValues.pageList}
          activeIndex={paginateValues.activeIndex}
          disableBack={paginateValues.disableBack}
          disableForward={paginateValues.disableForward}
          hideStart={paginateValues.hideStart}
          hideEnd={paginateValues.hideEnd}
          lastPage={paginateValues.lastPage}
          currentPage={currentPage}
          pageSize={pageSize}
          pageSizes={pageSizes}
        />
      </PaginationWrapper>
    </>
  );
}

const PaginationWrapper = styled.div``;
