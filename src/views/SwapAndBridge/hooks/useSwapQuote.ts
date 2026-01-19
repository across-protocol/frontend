import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  swapApprovalApiCall,
  SwapApprovalQuote,
  SwapApprovalApiQueryParams,
} from "utils/serverless-api/prod/swap-approval";
import { useDebounce } from "@uidotdev/usehooks";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { INTEGRATOR_ID_ACROSS } from "utils";
import { useEcosystemAccounts } from "../../../hooks/useEcosystemAccounts";
import { useTrackTransferQuoteReceivedEffect } from "./useTrackTransferQuoteReceived";
import { useRef } from "react";

export type SwapQuote = ReturnType<typeof useSwapQuote>["swapQuote"];

const useSwapQuote = (quoteRequest: QuoteRequest) => {
  const {
    amount,
    customDestinationAccount,
    destinationToken,
    originToken,
    tradeType,
  } = quoteRequest;

  const { depositor, depositorOrPlaceholder, recipientOrPlaceholder } =
    useEcosystemAccounts({
      originToken,
      destinationToken,
      customDestinationAccount,
    });

  const debouncedAmount = useDebounce(amount, 300);
  const skipOriginTxEstimation = !depositor;

  const quoteStartTimeRef = useRef<number>(0);

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: [
      "swap-quote",
      debouncedAmount,
      customDestinationAccount?.address,
      destinationToken?.address,
      destinationToken?.chainId,
      originToken?.address,
      originToken?.chainId,
      tradeType,
      depositor,
      depositorOrPlaceholder,
      recipientOrPlaceholder,
      skipOriginTxEstimation,
    ],
    queryFn: (): Promise<SwapApprovalQuote | undefined> => {
      quoteStartTimeRef.current = Date.now();

      if (Number(debouncedAmount) <= 0) {
        return Promise.resolve(undefined);
      }
      if (!originToken || !destinationToken || !debouncedAmount) {
        throw new Error("Missing required swap quote parameters");
      }

      const params: SwapApprovalApiQueryParams = {
        tradeType: tradeType,
        inputToken: originToken.address,
        outputToken: destinationToken.address,
        originChainId: originToken.chainId,
        destinationChainId: destinationToken.chainId,
        depositor: depositorOrPlaceholder,
        recipient: customDestinationAccount
          ? customDestinationAccount.address
          : recipientOrPlaceholder,
        amount: debouncedAmount.toString(),
        refundOnOrigin: true,
        skipOriginTxEstimation,
        integratorId: INTEGRATOR_ID_ACROSS,
      };

      return swapApprovalApiCall(params);
    },
    enabled:
      !!originToken?.address &&
      !!destinationToken?.address &&
      !!debouncedAmount,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status) {
        const status = error.response.status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 2;
    },
    refetchInterval: (query) =>
      query.state.status === "success" ? 10_000 : false,
  });

  useTrackTransferQuoteReceivedEffect({
    quote: data,
    quoteRequest,
    dataUpdatedAt,
    depositorOrPlaceholder,
    recipientOrPlaceholder,
    customDestinationAddress: customDestinationAccount?.address,
    quoteStartTimeRef,
  });

  return { swapQuote: data, isQuoteLoading: isLoading, quoteError: error };
};

export default useSwapQuote;
