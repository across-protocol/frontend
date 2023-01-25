import { BigNumber, BigNumberish } from "ethers";
import { formatNumberTwoSigDigits } from "utils";
import { TableCell } from "../TransactionsTable.styles";

export function FilledPercentageCell(props: {
  filled: BigNumberish;
  amount: BigNumberish;
}) {
  const totalAmount = BigNumber.from(props.amount);

  const filledPercentage = totalAmount.gt(0)
    ? BigNumber.from(props.filled).mul(100).div(totalAmount)
    : BigNumber.from(0);

  return (
    <TableCell>
      {filledPercentage.toNumber() > 100
        ? "100"
        : formatNumberTwoSigDigits(filledPercentage.toNumber())}
      %
    </TableCell>
  );
}
