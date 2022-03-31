import type { BridgeFees } from "./bridge";
import { BigNumber, BigNumberish } from "ethers";

export function max(a: BigNumberish, b: BigNumberish) {
  if (BigNumber.from(a).gte(b)) return BigNumber.from(a);
  return BigNumber.from(b);
}

export function receiveAmount(amount: BigNumber, fees?: BridgeFees) {
  if (amount.eq(0)) return BigNumber.from(0);
  if (!fees) return amount;
  return max(amount.sub(fees.relayerFee.total).sub(fees.lpFee.total), 0);
}
