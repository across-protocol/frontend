import { BigNumber } from "ethers";
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
