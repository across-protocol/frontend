import { QuoteRequest, QuoteRequestAction } from "./quoteRequestAction";
import { Dispatch, useEffect } from "react";
import { useConnectionEVM } from "../../../../hooks/useConnectionEVM";
import { useConnectionSVM } from "../../../../hooks/useConnectionSVM";
import { getEcosystemFromToken } from "../../../../utils";

// Placeholder addresses for quote simulation when wallet is not connected
export const PLACEHOLDER_EVM_ADDRESS =
  "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
export const PLACEHOLDER_SVM_ADDRESS =
  "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t";

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
