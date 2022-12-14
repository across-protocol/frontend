import { TransferStatus } from "@across-protocol/sdk-v2/dist/transfers-history";
import { BigNumber, utils } from "ethers";
import { capitalizeFirstLetter, ChainId, fixedPointAdjustment } from "utils";
import { TableCell } from "../TransactionsTable.styles";
import { useSuggestedRelayerFeePct } from "hooks/useSuggestedRelayerFeePct";

const SUGGESTED_FEES_DEVIATION_BUFFER_MULTIPLIER = "1.1";

type Props = {
  status: TransferStatus;
  amount: BigNumber;
  fromChainId: ChainId;
  toChainId: ChainId;
  tokenSymbol: string;
  depositTime: number;
  currentRelayerFeePct: BigNumber;
  enableSpeedUp?: boolean;
};

export function StatusCell(props: Props) {
  if (props.status === "pending" && props.enableSpeedUp) {
    return <PendingStatusCell {...props} />;
  }

  return <TableCell>{capitalizeFirstLetter(props.status)}</TableCell>;
}

function PendingStatusCell(props: Props) {
  const { data: suggestedRelayerFeePct } = useSuggestedRelayerFeePct(
    props.amount,
    props.fromChainId,
    props.toChainId,
    props.tokenSymbol,
    props.depositTime
  );

  const isUnprofitable =
    suggestedRelayerFeePct &&
    suggestedRelayerFeePct.gt(
      props.currentRelayerFeePct
        .mul(utils.parseEther(SUGGESTED_FEES_DEVIATION_BUFFER_MULTIPLIER))
        .div(fixedPointAdjustment)
    );

  return <TableCell>{isUnprofitable ? "Unprofitable" : "Pending"}</TableCell>;
}
