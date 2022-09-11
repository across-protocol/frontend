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
  if (divisor.isZero()) {
    throw new Error(
      `Cannot divide by zero. Attempting to divide ${numerator.toString()} by 0`
    );
  }
  return numerator.div(divisor);
}

/**
 * Tests whether a BigNumberish is within range of a maximum and minimum
 * @param value The value to test the range
 * @param inclusive Whether this range is inclusive or exclusive of the range
 * @param minimum The minimum of the range
 * @param maximum The maximum of the range
 * @param parser An optional parser to parse the `value` into a BigNumber. Defaults to `BigNumber.from`
 * @returns `true` if `value` is valid and within range of the `maximum` and `minimum`
 */
export function isNumericWithinRange(
  value: BigNumberish,
  inclusive: boolean,
  minimum?: BigNumberish,
  maximum?: BigNumberish,
  parser: (arg0: string) => BigNumber = BigNumber.from
): boolean {
  if (!isNumberEthersParseable(value)) return false;
  const valueBN = parser(value.toString());
  const min = (v: BigNumberish) => (inclusive ? valueBN.gte(v) : valueBN.gt(v));
  const max = (v: BigNumberish) => (inclusive ? valueBN.lte(v) : valueBN.lt(v));

  if (maximum && minimum) {
    // Both min and max are defined
    return min(minimum) && max(maximum);
  } else if (!maximum && minimum) {
    // minimum is only defined
    return min(minimum);
  } else if (maximum && !minimum) {
    // maximum is only defined
    return max(maximum);
  } else {
    // no range is defined. value is always within range of -inf, inf
    return true;
  }
}
