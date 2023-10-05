import { BigNumber, BigNumberish, utils } from "ethers";
import {
  capitalizeFirstLetter,
  fallbackSuggestedRelayerFeePct,
  fixedPointAdjustment,
  suggestedFeesDeviationBufferMultiplier,
} from "utils";
import { TableCell } from "../TransactionsTable.styles";
import { transfersHistory } from "@across-protocol/sdk-v2";

type Props = {
  status: transfersHistory.TransferStatus;
  currentRelayerFeePct: BigNumberish;
  suggestedRelayerFeePct?: BigNumberish;
  enableSpeedUp?: boolean;
};

export function StatusCell(props: Props) {
  if (props.status === "pending" && props.enableSpeedUp) {
    return <PendingStatusCell {...props} />;
  }

  return <TableCell>{capitalizeFirstLetter(props.status)}</TableCell>;
}

function PendingStatusCell(props: Props) {
  const isProfitable = BigNumber.from(
    props.suggestedRelayerFeePct || fallbackSuggestedRelayerFeePct
  ).lte(
    BigNumber.from(props.currentRelayerFeePct)
      .mul(utils.parseEther(String(suggestedFeesDeviationBufferMultiplier)))
      .div(fixedPointAdjustment)
  );

  return <TableCell>{isProfitable ? "Pending" : "Unprofitable"}</TableCell>;
}
