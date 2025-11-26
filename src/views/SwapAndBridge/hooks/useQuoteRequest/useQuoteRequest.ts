import { useReducer } from "react";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { QuoteRequest } from "./quoteRequestAction";

export const useQuoteRequest = () => {
  const [quoteRequest, dispatchQuoteRequestAction] = useReducer(
    quoteRequestReducer,
    {
      tradeType: "exactInput",
      originToken: null,
      destinationToken: null,
      originAccount: null,
      destinationAccount: null,
      amount: null,
    } satisfies QuoteRequest
  );
  return { quoteRequest, dispatchQuoteRequestAction };
};
