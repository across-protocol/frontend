import { Deposit } from "hooks/useDeposits";

import { NetFeeCell } from "./NetFeeCell";

type Props = {
  deposit: Deposit;
  width: number;
};

export function BridgeFeeCell({ deposit, width }: Props) {
  return <NetFeeCell deposit={deposit} width={width} />;
}
