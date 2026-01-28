import Pagination, { paginate } from "components/Pagination";
import { TransfersTable, TransfersTableProps } from "./TransfersTable";

type Props = TransfersTableProps & {
  currentPage: number;
  onPageChange: (newPage: number) => void;
  currentPageSize: number;
  onPageSizeChange: (newPageSize: number) => void;
  totalCount: number;
  initialPageSize?: number;
  pageSizes?: number[];
  displayPageNumbers?: boolean;
  hasNoResults: boolean;
};

const DEFAULT_PAGE_SIZES = [10, 25, 50];

export function PaginatedTransfersTable({
  currentPage,
  onPageChange,
  currentPageSize,
  onPageSizeChange,
  totalCount,
  pageSizes = DEFAULT_PAGE_SIZES,
  displayPageNumbers = true,
  hasNoResults,
  ...transfersTableProps
}: Props) {
  const paginateValues = paginate({
    elementCount: totalCount,
    currentPage,
    maxNavigationCount: 5,
    elementsPerPage: currentPageSize,
  });

  return (
    <>
      <TransfersTable {...transfersTableProps} />
      {!hasNoResults && (
        <div>
          <Pagination
            displayPageNumbers={displayPageNumbers}
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
        </div>
      )}
    </>
  );
}
