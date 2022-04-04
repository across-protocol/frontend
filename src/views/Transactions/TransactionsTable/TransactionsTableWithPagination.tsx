import { FC } from "react";
import { ICell, IRow } from "components/Table/Table";
import TransactionsTable from "./TransactionsTable";
import Pagination from "components/Pagination";
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
  totalPerPage,
}) => {
  return (
    <>
      <TransactionsTable rows={rows} headers={headers} title={title} />
      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        elements={elements}
        totalPerPage={totalPerPage}
      />
    </>
  );
};

export default TransactionsTableWithPagination;
