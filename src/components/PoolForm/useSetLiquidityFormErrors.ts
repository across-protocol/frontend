import { useEffect } from "react";
import { ethers } from "ethers";
import { toWeiSafe } from "utils";

export default function useLiquidityInputValue(
  value: string,
  balance: string,
  decimals: number,
  symbol: string,
  addLiquidityGas: ethers.BigNumber,
  setFormError: React.Dispatch<React.SetStateAction<string>>
) {
  // Validate input on change
  useEffect(() => {
    try {
      // liquidity button should be disabled if value is 0, so we dont actually need an error.
      if (Number(value) === 0) return setFormError("");
      if (Number(value) < 0) return setFormError("Cannot be less than 0.");
      if (value && balance) {
        const valueToWei = toWeiSafe(value, decimals);
        if (valueToWei.gt(balance)) {
          return setFormError("Liquidity amount greater than balance.");
        }
      }

      if (value && symbol === "ETH") {
        const valueToWei = toWeiSafe(value, decimals);
        if (valueToWei.add(addLiquidityGas).gt(balance)) {
          return setFormError("Transaction may fail due to insufficient gas.");
        }
      }
    } catch (e) {
      return setFormError("Invalid number.");
    }
    // clear form if no errors were presented. All errors should return early.
    setFormError("");
  }, [value, balance, decimals, symbol, addLiquidityGas, setFormError]);
}
