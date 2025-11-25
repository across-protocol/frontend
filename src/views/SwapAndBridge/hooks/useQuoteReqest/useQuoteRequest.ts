import { useReducer } from "react";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { QuoteRequest } from "./types";

const initialState = {
  tradeType: "exactInput",
  originToken: null,
  destinationToken: null,
  originAccount: null,
  destinationAccount: null,
  amount: null,
} satisfies QuoteRequest;

export const useQuoteRequest = () => {
  const [quoteRequest, dispatchQuoteAction] = useReducer(
    quoteRequestReducer,
    initialState
  );

  return { quoteRequest, dispatchQuoteAction };
};
