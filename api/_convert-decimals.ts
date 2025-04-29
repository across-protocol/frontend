import { BigNumber } from "ethers";

// Copied from @uma/common
export const ConvertDecimals = (fromDecimals: number, toDecimals: number) => {
  // amount: string, BN, number - integer amount in fromDecimals smallest unit that want to convert toDecimals
  // returns: string with toDecimals in smallest unit
  return (amount: BigNumber) => {
    amount = BigNumber.from(amount);
    if (amount.isZero()) return amount;
    const diff = fromDecimals - toDecimals;
    if (diff === 0) return amount;
    if (diff > 0) return amount.div(BigNumber.from("10").pow(diff));
    return amount.mul(BigNumber.from("10").pow(-1 * diff));
  };
};
