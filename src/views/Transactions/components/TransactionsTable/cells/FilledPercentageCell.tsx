import { BigNumber, BigNumberish } from "ethers";
import { formatNumberTwoSigDigits } from "utils";
import { TableCell } from "../TransactionsTable.styles";

export function FilledPercentageCell(props: {
  filled: BigNumberish;
  amount: BigNumberish;
}) {
  const filledPercentage = BigNumber.from(props.filled)
    .mul(100)
    .div(props.amount);

  return (
    <TableCell>
      {filledPercentage.toNumber() > 100
        ? "100"
        : formatNumberTwoSigDigits(filledPercentage.toNumber())}
      %
    </TableCell>
  );
}
