import { QuoteRequest, QuoteRequestAction } from "./quoteRequestAction";
import { Dispatch, useEffect } from "react";
import { useConnectionEVM } from "../../../../hooks/useConnectionEVM";
import { useConnectionSVM } from "../../../../hooks/useConnectionSVM";
import { getEcosystemFromToken } from "../../../../utils";

export const useAccountInQuote = (
  quoteRequest: QuoteRequest,
  dispatchQuoteRequestAction: Dispatch<QuoteRequestAction>
) => {
  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();

  useEffect(() => {
    if (
      getEcosystemFromToken(quoteRequest.originToken) === "evm" &&
      accountEVM
    ) {
      dispatchQuoteRequestAction({
        type: "SET_ORIGIN_ACCOUNT",
        payload: {
          accountType: "evm",
          address: accountEVM,
        },
      });
    }
    if (
      getEcosystemFromToken(quoteRequest.originToken) === "svm" &&
      accountSVM
    ) {
      dispatchQuoteRequestAction({
        type: "SET_ORIGIN_ACCOUNT",
        payload: {
          accountType: "svm",
          address: accountSVM.toBase58(),
        },
      });
    }
  }, [
    accountEVM,
    accountSVM,
    dispatchQuoteRequestAction,
    quoteRequest.originToken,
  ]);
};
