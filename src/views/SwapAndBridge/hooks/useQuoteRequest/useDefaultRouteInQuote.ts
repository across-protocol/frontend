import { useEffect } from "react";
import { useDefaultRoute } from "../useDefaultRoute";
import { useQuoteRequestContext } from "./QuoteRequestContext";

export const useDefaultRouteInQuote = () => {
  const { setOriginToken, setDestinationToken } = useQuoteRequestContext();
  const defaultRoute = useDefaultRoute();

  useEffect(() => {
    if (defaultRoute.inputToken) {
      setOriginToken(defaultRoute.inputToken);
    }
    if (defaultRoute.outputToken) {
      setDestinationToken(defaultRoute.outputToken);
    }
  }, [defaultRoute, setOriginToken, setDestinationToken]);
};
