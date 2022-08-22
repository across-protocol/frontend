import { TransferStatus } from "@across-protocol/sdk-v2/dist/transfers-history";
import { capitalizeFirstLetter } from "utils";
import { TableCell } from "../TransactionsTable.styles";

export function StatusCell(props: { status: TransferStatus }) {
  return <TableCell>{capitalizeFirstLetter(props.status)}</TableCell>;
}
