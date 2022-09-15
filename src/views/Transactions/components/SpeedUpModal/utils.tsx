import { BigNumber, utils } from "ethers";
import { toWeiSafe } from "utils";

export function appendPercentageSign(feeInput: string) {
  return feeInput.replaceAll("%", "") + "%";
}

export function removePercentageSign(feeInput: string) {
  return feeInput.replaceAll("%", "");
}

export function feeInputToBigNumberPct(feeInput: string) {
  return toWeiSafe(removePercentageSign(feeInput) || "0").div(
    BigNumber.from(100)
  );
}

export function calcPctOfTokenAmount(
  pctBigNumber: BigNumber,
  tokenAmount: BigNumber
) {
  return pctBigNumber.mul(tokenAmount).div(utils.parseEther("1"));
}

export function validateFeeInput(
  input: string,
  opts: {
    maxFeePct: number;
    minFeePct: number;
    maxDecimals: number;
  }
) {
  const cleanedInput = removePercentageSign(input);
  const inputNum = Number(cleanedInput);
  if (isNaN(inputNum)) {
    throw new Error("Invalid number");
  }

  const inputPct = inputNum / 100;
  if (inputPct > opts.maxFeePct || inputPct < opts.minFeePct) {
    throw new Error(
      `Fee must be between ${opts.minFeePct * 100}% and ${
        opts.maxFeePct * 100
      }%`
    );
  }

  if (
    cleanedInput.includes(".") &&
    cleanedInput.split(".")[1].length > opts.maxDecimals
  ) {
    throw new Error(`Max. ${opts.maxDecimals} decimals allowed`);
  }
}
