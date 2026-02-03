import { createSwapApprovalActionHook } from "./factory";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { EVMSwapApprovalActionStrategy } from "./strategies/evm";
import { SVMSwapApprovalActionStrategy } from "./strategies/svm";
import { getEcosystem } from "utils/network";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";
import { UseMutateAsyncFunction } from "@tanstack/react-query/build/modern/types";
import { QuoteRequest } from "../useQuoteRequest/quoteRequestAction";

export interface SwapApproval {
  isConnected: boolean;
  isWrongNetwork: boolean;
  buttonActionHandler: UseMutateAsyncFunction<string, Error>;
  isButtonActionLoading: boolean;
  didActionError: boolean;
  buttonDisabled: boolean;
}

export const useSwapApprovalAction = (
  quoteRequest: QuoteRequest,
  swapQuote?: SwapApprovalQuote
): SwapApproval => {
  const connectionEVM = useConnectionEVM();
  const connectionSVM = useConnectionSVM();

  const evmHook = createSwapApprovalActionHook(
    new EVMSwapApprovalActionStrategy(connectionEVM)
  );
  const svmHook = createSwapApprovalActionHook(
    new SVMSwapApprovalActionStrategy(connectionSVM, connectionEVM)
  );

  return getEcosystem(quoteRequest.originToken?.chainId || 0) === "evm"
    ? evmHook(quoteRequest, swapQuote)
    : svmHook(quoteRequest, swapQuote);
};
