import { QuoteRequest } from "../hooks/useQuoteRequest/quoteRequestAction";
import { BigNumber } from "ethers";

export const hasInsufficientBalance = (
  { userInputAmount, userInputField, quoteOutputAmount }: QuoteRequest,
  balance: BigNumber | undefined
) => {
  if (!userInputAmount) {
    return false;
  }
  if (userInputField === "origin" && balance) {
    if (userInputAmount.gt(balance)) {
      return true;
    }
  } else if (userInputField === "destination" && quoteOutputAmount && balance) {
    if (quoteOutputAmount.gt(balance)) {
      return true;
    }
  }
  return false;
};
