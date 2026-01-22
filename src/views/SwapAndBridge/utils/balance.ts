import { QuoteRequest } from "../hooks/useQuoteRequest/quoteRequestAction";
import { BigNumber } from "ethers";

export const hasInsufficientBalance = (
  { amount, tradeType }: QuoteRequest,
  expectedAmount: BigNumber | undefined,
  balance: BigNumber | undefined
) => {
  if (!amount) {
    return false;
  }
  if (tradeType === "exactInput" && balance) {
    // isAmountorigin
    if (amount.gt(balance)) {
      return true;
    }
  } else if (tradeType === "minOutput" && expectedAmount && balance) {
    if (expectedAmount.gt(balance)) {
      return true;
    }
  }
  return false;
};
