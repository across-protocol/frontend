import { FC } from "react";
import { ICell, IRow } from "components/Table/Table";
import TransactionsTable from "./TransactionsTable";

interface TxTableIRow extends IRow {
  onClick?: () => void;
}

interface Props {
  rows: TxTableIRow[];
  headers: ICell[];
  title: string;
}

const TransactionsTableWithPagination: FC<Props> = ({
  rows,
  headers,
  title,
}) => {
  return (
    <>
      <TransactionsTable rows={rows} headers={headers} title={title} />
    </>
  );
};

export default TransactionsTableWithPagination;
