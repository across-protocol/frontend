import { FC } from "react";
import { ICell } from "components/Table/Table";
import MobileTransactionsTable from "./MobileTransactionsTable";
import Pagination from "components/Pagination";
import { IMobileRow } from "./createMobileTransactionTableJSX";

interface Props {
  rows: IMobileRow[];
  headers: ICell[];
  title: string;
  elements: any[];
  openIndex: number;
  totalPerPage: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const MobileTransactionsTableWithPagination: FC<Props> = ({
  rows,
  headers,
  title,
  openIndex,
  elements,
  currentPage,
  setCurrentPage,
  totalPerPage,
}) => {
  return (
    <>
      <MobileTransactionsTable
        rows={rows}
        headers={headers}
        title={title}
        openIndex={openIndex}
      />
      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        elements={elements}
        totalPerPage={totalPerPage}
      />
    </>
  );
};

export default MobileTransactionsTableWithPagination;
