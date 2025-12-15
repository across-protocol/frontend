import { QuoteRequest } from "../hooks/useQuoteRequest/quoteRequestAction";
import { BigNumber } from "ethers";

export const hasInsufficientBalance = (
  { userInputAmount, userInputField }: QuoteRequest,
  expectedAmount: BigNumber | undefined,
  balance: BigNumber | undefined
) => {
  if (!userInputAmount) {
    return false;
  }
  if (userInputField === "origin" && balance) {
    if (userInputAmount.gt(balance)) {
      return true;
    }
  } else if (userInputField === "destination" && expectedAmount && balance) {
    if (expectedAmount.gt(balance)) {
      return true;
    }
  }
  return false;
};
