import { utils } from "ethers";
const { parseUnits: toWei } = utils;

const DEFAULT_PRECISION = 18;

// `toWeiSafe()` should always be used to convert floats into wei values
// before passing the result as a transaction arg, as Solidity cannot deal with non-Integers.
// If the argument to pass into `toWei()` has too much precision (specifically more than `precisionToUse`),
// then `toWei()` might return a string number with decimals, which Solidity cannot handle.
export function toWeiSafe(
  numberToConvertToWei: string,
  desiredPrecision = DEFAULT_PRECISION
) {
  // Try converting just the raw string first to avoid unneccessary stripping of precision.
  try {
    return toWei(numberToConvertToWei, desiredPrecision);
  } catch (err) {
    // This shouldn't throw an error, and if it does then its unexpected and we want to know about it.
    return toWei(
      Number(numberToConvertToWei).toFixed(desiredPrecision),
      desiredPrecision
    );
  }
}
