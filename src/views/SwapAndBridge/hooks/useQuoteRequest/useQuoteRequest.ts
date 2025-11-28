import { useReducer } from "react";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { QuoteRequest } from "./quoteRequestAction";
import { PLACEHOLDER_EVM_ADDRESS } from "./useAccountInQuote";

export const initialQuote: QuoteRequest = {
  tradeType: "exactInput",
  originToken: null,
  destinationToken: null,
  originAccount: { accountType: "evm", address: PLACEHOLDER_EVM_ADDRESS },
  destinationAccount: { accountType: "evm", address: PLACEHOLDER_EVM_ADDRESS },
  amount: null,
};

export const useQuoteRequest = () => {
  const [quoteRequest, dispatchQuoteRequestAction] = useReducer(
    quoteRequestReducer,
    initialQuote
  );
  return { quoteRequest, dispatchQuoteRequestAction };
};
