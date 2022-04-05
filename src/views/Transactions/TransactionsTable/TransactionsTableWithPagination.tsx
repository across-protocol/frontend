import { FC } from "react";
import { ICell, IRow } from "components/Table/Table";
import TransactionsTable from "./TransactionsTable";
import Pagination from "components/Pagination";
import paginate from "components/Pagination/paginate";

interface TxTableIRow extends IRow {
  onClick?: () => void;
}

interface Props {
  rows: TxTableIRow[];
  headers: ICell[];
  title: string;
  elements: any[];
  totalPerPage: number;
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
      <Pagination onPageChange={setCurrentPage} {...paginateState} />
    </>
  );
};

export default TransactionsTableWithPagination;
