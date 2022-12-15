import { TransferStatus } from "@across-protocol/sdk-v2/dist/transfers-history";
import { BigNumber, BigNumberish, utils } from "ethers";
import {
  capitalizeFirstLetter,
  fixedPointAdjustment,
  suggestedFeesDeviationBufferMultiplier,
} from "utils";
import { TableCell } from "../TransactionsTable.styles";

type Props = {
  status: TransferStatus;
  currentRelayerFeePct: BigNumberish;
  suggestedRelayerFeePct: BigNumberish;
  enableSpeedUp?: boolean;
};

export function StatusCell(props: Props) {
  if (props.status === "pending" && props.enableSpeedUp) {
    return <PendingStatusCell {...props} />;
  }

  return <TableCell>{capitalizeFirstLetter(props.status)}</TableCell>;
}

function PendingStatusCell(props: Props) {
  const isProfitable = BigNumber.from(props.suggestedRelayerFeePct).lte(
    BigNumber.from(props.currentRelayerFeePct)
      .mul(utils.parseEther(String(suggestedFeesDeviationBufferMultiplier)))
      .div(fixedPointAdjustment)
  );

  return <TableCell>{isProfitable ? "Pending" : "Unprofitable"}</TableCell>;
}
