import type { BridgeFees } from "./bridge";
import { BigNumber, BigNumberish } from "ethers";

export function max(a: BigNumberish, b: BigNumberish) {
  if (BigNumber.from(a).gte(b)) return BigNumber.from(a);
  return BigNumber.from(b);
}

type PartialBridgeFees = {
  instantRelayFee: Pick<BridgeFees["instantRelayFee"], "total">;
} & {
  slowRelayFee: Pick<BridgeFees["slowRelayFee"], "total">;
} & {
  lpFee: Pick<BridgeFees["lpFee"], "total">;
};
export function receiveAmount(amount: BigNumberish, fees?: PartialBridgeFees) {
  const amountBn = BigNumber.from(amount);
  if (amountBn.lte(0)) return BigNumber.from(0);
  if (!fees) return amountBn;
  return max(
    amountBn
      .sub(fees.instantRelayFee.total)
      .sub(fees.slowRelayFee.total)
      .sub(fees.lpFee.total),
    0
  );
}
