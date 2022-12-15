import { BigNumberish } from "ethers";
import { formatUnits } from "utils";
import { TableCell } from "../TransactionsTable.styles";

export function AmountCell(props: { amount: BigNumberish; decimals: number }) {
  return (
    <TableCell>
      {formatUnits(props.amount, props.decimals).toString()}
    </TableCell>
  );
}
