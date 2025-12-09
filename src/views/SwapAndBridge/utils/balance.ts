import { QuoteRequest } from "../hooks/useQuoteRequest/quoteRequestAction";
import { BigNumber } from "ethers";

export const hasInsufficientBalance = (
  { amount, originToken, tradeType }: QuoteRequest,
  expectedAmount: BigNumber | undefined
) => {
  if (!amount) {
    return false;
  }
  if (tradeType === "exactInput" && originToken?.balance) {
    // isAmountorigin
    if (amount.gt(originToken.balance)) {
      return true;
    }
  } else if (
    tradeType === "minOutput" &&
    expectedAmount &&
    originToken?.balance
  ) {
    if (expectedAmount?.gt(originToken.balance)) {
      return true;
    }
  }
  return false;
};
