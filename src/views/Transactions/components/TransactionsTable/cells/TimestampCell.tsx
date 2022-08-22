import { DateTime } from "luxon";
import { TableCell } from "../TransactionsTable.styles";

export function TimestampCell(props: { timestamp: number }) {
  return (
    <TableCell>
      {DateTime.fromSeconds(props.timestamp).toFormat("d MMM yyyy - t")}
    </TableCell>
  );
}
