import { FC } from "react";
import { ICell, IRow } from "components/Table/Table";
import TransactionsTable from "./TransactionsTable";
import Pagination from "components/PaginationV2";
import paginate from "components/Pagination/paginate";
import { PaginationWrapper } from "./TransactionsTable.styles";

interface TxTableIRow extends IRow {
  onClick?: () => void;
}

interface Props {
  rows: TxTableIRow[];
  headers: ICell[];
  title: string;
  elements: any[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  initialLoading: boolean;
  pageSize: number;
  setPageSize: (value: number) => void;
  pageSizes: number[];
}

const TransactionsTableWithPagination: FC<Props> = ({
  rows,
  headers,
  title,
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
      <TransactionsTable rows={paginatedRows} headers={headers} title={title} />
      {paginateState.totalPages > 1 ? (
        <PaginationWrapper>
          <Pagination
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
            pageSizes={pageSizes}
            onPageChange={setCurrentPage}
            {...paginateState}
          />
        </PaginationWrapper>
      ) : null}
    </>
  );
};

export default TransactionsTableWithPagination;
