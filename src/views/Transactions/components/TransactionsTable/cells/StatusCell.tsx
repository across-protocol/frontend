import { TransferStatus } from "@across-protocol/sdk-v2/dist/transfers-history";
import { BigNumber } from "ethers";
import { capitalizeFirstLetter } from "utils";
import { isUnprofitable } from "../../../utils";
import { TableCell } from "../TransactionsTable.styles";

export function StatusCell(props: {
  status: TransferStatus;
  depositTime: number;
  currentRelayerFeePct: BigNumber;
}) {
  const statusToDisplay =
    props.status === "pending"
      ? isUnprofitable(props.depositTime, props.currentRelayerFeePct)
        ? "unprofitable"
        : "pending"
      : "filled";
  return <TableCell>{capitalizeFirstLetter(statusToDisplay)}</TableCell>;
}
