import { FC } from "react";
import { ICell } from "components/Table/Table";
import MobileTransactionsTable from "./MobileTransactionsTable";
import Pagination from "components/Pagination";
import { IMobileRow } from "./createMobileTransactionTableJSX";
import paginate from "components/Pagination/paginate";
import { PaginationWrapper } from "./TransactionsTable.styles";

interface Props {
  rows: IMobileRow[];
  headers: ICell[];
  title: string;
  elements: any[];
  openIndex: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  initialLoading: boolean;
  pageSize: number;
  setPageSize: (value: number) => void;
  pageSizes: number[];
}

const MobileTransactionsTableWithPagination: FC<Props> = ({
  rows,
  headers,
  title,
  openIndex,
  elements,
  currentPage,
  setCurrentPage,
  initialLoading,
  pageSize,
  pageSizes,
  setPageSize,
}) => {
  const elementCount = elements.length;

  const paginateState = paginate({
    elementCount,
    currentPage,
    maxNavigationCount: 5,
    elementsPerPage: pageSize,
  });

  const paginatedRows = rows.slice(
    paginateState.startIndex,
    paginateState.endIndex
  );

  if (initialLoading) return null;
  return (
    <>
      <MobileTransactionsTable
        rows={paginatedRows}
        headers={headers}
        title={title}
        openIndex={openIndex}
        currentPage={currentPage}
        elementsPerPage={pageSize}
      />
      {paginateState.totalPages > 1 ? (
        <PaginationWrapper>
          <Pagination
            onPageChange={setCurrentPage}
            {...paginateState}
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
            pageSizes={pageSizes}
          />
        </PaginationWrapper>
      ) : null}
    </>
  );
};

export default MobileTransactionsTableWithPagination;
