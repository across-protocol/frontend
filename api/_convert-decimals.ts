import { BigNumber } from "ethers";

// Copied from @uma/common
/**
 * Factory function that creates a function that converts an amount from one number of decimals to another.
 * Copied from @uma/common
 * @param fromDecimals The number of decimals of the input amount.
 * @param toDecimals The number of decimals of the output amount.
 * @returns A function that converts an amount from `fromDecimals` to `toDecimals`.
 */
export const ConvertDecimals = (fromDecimals: number, toDecimals: number) => {
  return (amount: BigNumber): BigNumber => {
    amount = BigNumber.from(amount);
    if (amount.isZero()) return amount;
    const diff = fromDecimals - toDecimals;
    if (diff === 0) return amount;
    if (diff > 0) return amount.div(BigNumber.from("10").pow(diff));
    return amount.mul(BigNumber.from("10").pow(-1 * diff));
  };
};
