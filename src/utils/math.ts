import type { BridgeFees } from "./bridge";
import { BigNumber, BigNumberish } from "ethers";

export function max(a: BigNumberish, b: BigNumberish) {
  if (BigNumber.from(a).gte(b)) return BigNumber.from(a);
  return BigNumber.from(b);
}

export function receiveAmount(amount: BigNumber, fees: BridgeFees) {
  return max(amount.sub(fees.relayerFee.total).sub(fees.lpFee.total), 0);
}

export function safeDivide(numerator: BigNumber, divisor: BigNumber) {
  let modifiedDivisor = divisor.isZero() ? BigNumber.from(1) : divisor;
  return numerator.div(modifiedDivisor);
}
