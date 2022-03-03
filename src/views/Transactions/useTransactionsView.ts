import { useState } from "react";

export default function useTransactionsView() {
  const [transactions] = useState([]);

  return {
    transactions,
  };
}
