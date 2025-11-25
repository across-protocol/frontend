import { useEffect, useReducer } from "react";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { QuoteRequest } from "./quoteRequestAction";
import { useDefaultRoute } from "../useDefaultRoute";

export const useQuoteRequest = () => {
  const defaultRoute = useDefaultRoute();

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

  useEffect(() => {
    if (defaultRoute.inputToken) {
      dispatchQuoteRequestAction({
        type: "SET_ORIGIN_TOKEN",
        payload: defaultRoute.inputToken,
      });
    }
    if (defaultRoute.outputToken) {
      dispatchQuoteRequestAction({
        type: "SET_DESTINATION_TOKEN",
        payload: defaultRoute.outputToken,
      });
    }
  }, [defaultRoute]);

  return { quoteRequest, dispatchQuoteRequestAction };
};
