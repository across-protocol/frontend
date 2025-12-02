import { QuoteRequest, QuoteRequestAction } from "./quoteRequestAction";
import { Dispatch, useEffect } from "react";
import { useConnectionEVM } from "../../../../hooks/useConnectionEVM";
import { useConnectionSVM } from "../../../../hooks/useConnectionSVM";
import { getEcosystemFromToken } from "../../../../utils";
import {
  PLACEHOLDER_EVM_ADDRESS,
  PLACEHOLDER_SVM_ADDRESS,
} from "./initialQuote";

export const useAccountInQuote = (
  quoteRequest: QuoteRequest,
  dispatchQuoteRequestAction: Dispatch<QuoteRequestAction>
) => {
  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();

  useEffect(() => {
    if (getEcosystemFromToken(quoteRequest.originToken) === "evm") {
      if (accountEVM) {
        dispatchQuoteRequestAction({
          type: "SET_ORIGIN_ACCOUNT",
          payload: {
            accountType: "evm",
            address: accountEVM,
          },
        });
      } else {
        dispatchQuoteRequestAction({
          type: "SET_ORIGIN_ACCOUNT",
          payload: {
            accountType: "evm",
            address: PLACEHOLDER_EVM_ADDRESS,
          },
        });
      }
    }
    if (getEcosystemFromToken(quoteRequest.originToken) === "svm") {
      if (accountSVM) {
        dispatchQuoteRequestAction({
          type: "SET_ORIGIN_ACCOUNT",
          payload: {
            accountType: "svm",
            address: accountSVM.toBase58(),
          },
        });
      } else {
        dispatchQuoteRequestAction({
          type: "SET_ORIGIN_ACCOUNT",
          payload: {
            accountType: "svm",
            address: PLACEHOLDER_SVM_ADDRESS,
          },
        });
      }
    }
  }, [
    accountEVM,
    accountSVM,
    dispatchQuoteRequestAction,
    quoteRequest.originToken,
  ]);
};
