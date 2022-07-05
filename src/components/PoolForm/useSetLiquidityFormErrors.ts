import { useEffect } from "react";
import { ethers } from "ethers";
import { toWeiSafe } from "utils";

export default function useSetLiquidityFormError(
  value: string,
  balance: string,
  decimals: number,
  symbol: string,
  setFormError: React.Dispatch<React.SetStateAction<string>>,
  addLiquidityGas: ethers.BigNumber = ethers.BigNumber.from("0")
) {
  // Validate input on change
  useEffect(() => {
    try {
      const v = value.replaceAll(",", "");
      // liquidity button should be disabled if value is 0, so we dont actually need an error.
      if (Number(v) === 0) return setFormError("");
      if (Number(v) < 0) return setFormError("Cannot be less than 0.");
      if (v && balance) {
        const valueToWei = toWeiSafe(v, decimals);
        if (valueToWei.gt(balance)) {
          return setFormError("Liquidity amount greater than balance.");
        }
      }

      if (v && symbol === "ETH") {
        const valueToWei = toWeiSafe(v, decimals);
        if (valueToWei.add(addLiquidityGas).gt(balance)) {
          return setFormError("Transaction may fail due to insufficient gas.");
        }
      }
    } catch (e) {
      console.log("e", e);
      return setFormError("Invalid number.");
    }
    // clear form if no errors were presented. All errors should return early.
    setFormError("");
  }, [value, balance, decimals, symbol, addLiquidityGas, setFormError]);
}
