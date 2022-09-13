import { utils, BigNumber } from "ethers";

export function appendPercentageSign(feeInput: string) {
  return feeInput.replace("%", "") + "%";
}

export function removePercentageSign(feeInput: string) {
  return feeInput.replace("%", "");
}

export function feeInputToBigNumberPct(feeInput: string) {
  return utils
    .parseEther(removePercentageSign(feeInput) || "0")
    .div(BigNumber.from(100));
}
