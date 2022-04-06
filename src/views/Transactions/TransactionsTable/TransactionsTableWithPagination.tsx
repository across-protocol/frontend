import { FC } from "react";
import { ICell, IRow } from "components/Table/Table";
import TransactionsTable from "./TransactionsTable";
import Pagination from "components/Pagination";
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
}

const TransactionsTableWithPagination: FC<Props> = ({
  rows,
  headers,
  title,
  elements,
  currentPage,
  setCurrentPage,
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

  return (
    <>
      <TransactionsTable rows={paginatedRows} headers={headers} title={title} />
      <PaginationWrapper>
        <Pagination onPageChange={setCurrentPage} {...paginateState} />
      </PaginationWrapper>
    </>
  );
};

export default TransactionsTableWithPagination;
