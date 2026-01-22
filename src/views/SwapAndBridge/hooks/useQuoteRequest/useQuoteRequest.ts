import { useReducer } from "react";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { initialQuote } from "./initialQuote";

export const useQuoteRequest = () => {
  const [quoteRequest, dispatchQuoteRequestAction] = useReducer(
    quoteRequestReducer,
    initialQuote
  );
  return { quoteRequest, dispatchQuoteRequestAction };
};
