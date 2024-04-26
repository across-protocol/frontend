import { useEffect, useState } from "react";
import { BigNumber } from "ethers";

import { parseAndValidateAmountInput } from "../utils";

export function useValidAmount(
  action: "add" | "remove",
  amount?: string,
  amountTokenDecimals?: number,
  maxAmounts?: {
    maxAddableAmount: BigNumber;
    maxRemovableAmount: BigNumber;
  }
) {
  const [amountValidationError, setAmountValidationError] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (amount && amountTokenDecimals && maxAmounts) {
      try {
        const maxAmount =
          action === "add"
            ? maxAmounts.maxAddableAmount
            : maxAmounts.maxRemovableAmount;
        parseAndValidateAmountInput(amount, amountTokenDecimals, maxAmount);
        setAmountValidationError(undefined);
      } catch (error) {
        setAmountValidationError((error as Error).message);
      }
    } else {
      setAmountValidationError(undefined);
    }
  }, [action, amount, amountTokenDecimals, maxAmounts]);

  return { amountValidationError };
}
