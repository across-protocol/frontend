import { Dispatch, useEffect } from "react";
import { QuoteRequestAction } from "./quoteRequestAction";
import { useDefaultRoute } from "../useDefaultRoute";

export const useDefaultRouteInQuote = (
  dispatchQuoteRequestAction: Dispatch<QuoteRequestAction>
) => {
  const defaultRoute = useDefaultRoute();
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
  }, [defaultRoute, dispatchQuoteRequestAction]);
};
