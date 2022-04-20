import { FC } from "react";
import { ICell } from "components/Table/Table";
import MobileTransactionsTable from "./MobileTransactionsTable";
import Pagination from "components/Pagination";
import { IMobileRow } from "./createMobileTransactionTableJSX";
import paginate from "components/Pagination/paginate";

interface Props {
  rows: IMobileRow[];
  headers: ICell[];
  title: string;
  elements: any[];
  openIndex: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  initialLoading: boolean;
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
}) => {
  const elementCount = elements.length;

  const paginateState = paginate({
    elementCount,
    currentPage,
    maxNavigationCount: 5,
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
      />
      {paginateState.totalPages > 1 ? (
        <Pagination onPageChange={setCurrentPage} {...paginateState} />
      ) : null}
    </>
  );
};

export default MobileTransactionsTableWithPagination;
