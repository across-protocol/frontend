import Pagination, { paginate } from "components/Pagination";
import {
  TransactionsTable,
  Props as TransactionsTableProps,
} from "./TransactionsTable";

import { PaginationWrapper } from "./TransactionsTable.styles";

type Props = TransactionsTableProps & {
  paginateValues: ReturnType<typeof paginate>;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  pageSize: number;
  pageSizes?: number[];
  onPageSizeChange: (newPageSizer: number) => void;
};

const DEFAULT_PAGE_SIZES = [10, 25, 50];

export function TransactionsTableWithPagination({
  paginateValues,
  currentPage,
  onPageChange,
  pageSize,
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageSizeChange,
  transferTuples,
  ...tableProps
}: Props) {
  return (
    <>
      <TransactionsTable transferTuples={transferTuples} {...tableProps} />
      {paginateValues.totalPages > 1 ? (
        <PaginationWrapper>
          <Pagination
            onPageSizeChange={onPageSizeChange}
            pageSize={pageSize}
            pageSizes={pageSizes}
            onPageChange={onPageChange}
            {...paginateValues}
          />
        </PaginationWrapper>
      ) : null}
    </>
  );
}

export default TransactionsTableWithPagination;
