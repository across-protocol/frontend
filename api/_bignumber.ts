import { BigNumber } from "ethers";

/**
 * Performs ceiling division on two BigNumbers.
 * Returns the smallest integer greater than or equal to the division result.
 *
 * Formula: divCeil(a, b) = (a + b - 1) / b
 *
 * @param dividend The number to be divided
 * @param divisor The number to divide by
 * @returns The ceiling of the division result
 * @throws Error if divisor is zero
 *
 */
export function divCeil(dividend: BigNumber, divisor: BigNumber): BigNumber {
  if (divisor.isZero()) {
    throw new Error("Division by zero");
  }

  // For negative numbers, we need to handle them differently
  // This implementation assumes positive numbers (common for token amounts, fees, etc.)
  if (dividend.isNegative() || divisor.isNegative()) {
    throw new Error("divCeil only supports positive BigNumbers");
  }

  // If dividend is 0, return 0
  if (dividend.isZero()) {
    return BigNumber.from(0);
  }

  // Ceiling division: (a + b - 1) / b
  return dividend.add(divisor).sub(1).div(divisor);
}
