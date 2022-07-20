import type { BridgeFees } from "./bridge";
import { BigNumber, BigNumberish } from "ethers";

export function max(a: BigNumberish, b: BigNumberish) {
  if (BigNumber.from(a).gte(b)) return BigNumber.from(a);
  return BigNumber.from(b);
}

export function receiveAmount(amount: BigNumber, fees: BridgeFees) {
  return max(
    amount
      .sub(fees.relayerCapitalFee.total)
      .sub(fees.lpFee.total)
      .sub(fees.relayerGasFee.total),
    0
  );
}
