import { useState, useEffect } from "react";
import { ICell, IRow } from "components/Table/Table";
import { formatTransactions } from "./format";

export default function useTransactionTableValues() {
  const [ongoingRows, setOngoingRows] = useState<IRow[]>([]);
  const [filledRows, setFilledRows] = useState<IRow[]>([]);
  // Only run this when transactions changes.
  // Stubbed in should only need to run once.
  useEffect(() => {
    const { rows: r } = formatTransactions();
    const filled = r.filter((x, i) => i !== 0);
    const pending = r.filter((x, i) => i === 0);
    setOngoingRows(pending);
    setFilledRows(filled);
  }, []);

  return {
    headers,
    ongoingRows,
    filledRows,
  };
}

const headers: ICell[] = [
  {
    size: "lg",
    value: "Deposit time",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Status",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Filled %",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Source",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Destination",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Asset",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Amount",
    cellClassName: "header-cell",
  },
  {
    size: "sm",
    value: "Deposit tx",
    cellClassName: "header-cell",
  },
];
