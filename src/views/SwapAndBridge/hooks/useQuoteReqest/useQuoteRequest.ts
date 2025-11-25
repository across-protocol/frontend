import { useReducer } from "react";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { QuoteRequest } from "./quoteRequestAction";

const initialState = {
  tradeType: "exactInput",
  originToken: null,
  destinationToken: null,
  originAccount: null,
  destinationAccount: null,
  amount: null,
} satisfies QuoteRequest;

export const useQuoteRequest = () => {
  const [quoteRequest, dispatchQuoteRequestAction] = useReducer(
    quoteRequestReducer,
    initialState
  );

  return { quoteRequest, dispatchQuoteRequestAction };
};
