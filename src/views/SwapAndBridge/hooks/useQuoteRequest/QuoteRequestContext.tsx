import { createContext, useContext, useReducer, useCallback } from "react";
import { BigNumber } from "ethers";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { initialQuote } from "./initialQuote";
import { QuoteRequest, QuoteAccount } from "./quoteRequestAction";
import { EnrichedToken } from "../../components/ChainTokenSelector/ChainTokenSelectorModal";

interface QuoteRequestContextValue {
  quoteRequest: QuoteRequest;
  setOriginToken: (token: EnrichedToken | null) => void;
  setDestinationToken: (token: EnrichedToken | null) => void;
  setOriginAmount: (amount: BigNumber | null) => void;
  setDestinationAmount: (amount: BigNumber | null) => void;
  setCustomDestinationAccount: (account: QuoteAccount) => void;
  resetCustomDestinationAccount: () => void;
  quickSwap: () => void;
}

const QuoteRequestContext = createContext<QuoteRequestContextValue | null>(
  null
);

export const QuoteRequestProvider = ({
  children,
  initialQuoteRequest,
}: {
  children: React.ReactNode;
  initialQuoteRequest?: QuoteRequest;
}) => {
  const [quoteRequest, dispatch] = useReducer(
    quoteRequestReducer,
    initialQuoteRequest ?? initialQuote
  );

  const setOriginToken = useCallback((token: EnrichedToken | null) => {
    dispatch({ type: "SET_ORIGIN_TOKEN", payload: token });
  }, []);

  const setDestinationToken = useCallback((token: EnrichedToken | null) => {
    dispatch({ type: "SET_DESTINATION_TOKEN", payload: token });
  }, []);

  const setOriginAmount = useCallback((amount: BigNumber | null) => {
    dispatch({ type: "SET_ORIGIN_AMOUNT", payload: amount });
  }, []);

  const setDestinationAmount = useCallback((amount: BigNumber | null) => {
    dispatch({ type: "SET_DESTINATION_AMOUNT", payload: amount });
  }, []);

  const setCustomDestinationAccount = useCallback((account: QuoteAccount) => {
    dispatch({ type: "SET_CUSTOM_DESTINATION_ACCOUNT", payload: account });
  }, []);

  const resetCustomDestinationAccount = useCallback(() => {
    dispatch({ type: "RESET_CUSTOM_DESTINATION_ACCOUNT" });
  }, []);

  const quickSwap = useCallback(() => {
    dispatch({ type: "QUICK_SWAP", payload: undefined });
  }, []);

  return (
    <QuoteRequestContext.Provider
      value={{
        quoteRequest,
        setOriginToken,
        setDestinationToken,
        setOriginAmount,
        setDestinationAmount,
        setCustomDestinationAccount,
        resetCustomDestinationAccount,
        quickSwap,
      }}
    >
      {children}
    </QuoteRequestContext.Provider>
  );
};

export const useQuoteRequestContext = () => {
  const context = useContext(QuoteRequestContext);
  if (!context) {
    throw new Error(
      "useQuoteRequestContext must be used within a QuoteRequestProvider"
    );
  }
  return context;
};
