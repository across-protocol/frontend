import assert from "assert";
import { BigNumber, BigNumberish } from "ethers";

/**
 * Convert a number from one decimal place to another.
 * @param fromDecimals - The number of decimal places the input number has.
 * @param toDecimals - The number of decimal places the output number should have.
 * @returns A function that converts a number from one decimal place to another.
 */
export const ConvertDecimals = (fromDecimals: number, toDecimals: number) => {
  assert(fromDecimals >= 0, "requires fromDecimals as an integer >= 0");
  assert(toDecimals >= 0, "requires toDecimals as an integer >= 0");
  return (amount: BigNumberish): BigNumber => {
    amount = BigNumber.from(amount);
    if (amount.isZero()) return amount;
    const diff = fromDecimals - toDecimals;
    if (diff === 0) return amount;
    if (diff > 0) return amount.div(BigNumber.from("10").pow(diff));
    return amount.mul(BigNumber.from("10").pow(-1 * diff));
  };
};
