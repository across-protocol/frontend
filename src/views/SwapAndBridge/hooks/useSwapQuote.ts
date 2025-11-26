import { useQuery } from "@tanstack/react-query";
import {
  swapApprovalApiCall,
  SwapApprovalApiCallReturnType,
  SwapApprovalApiQueryParams,
} from "utils/serverless-api/prod/swap-approval";
import { useDebounce } from "@uidotdev/usehooks";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";

const useSwapQuote = ({
  originToken: origin,
  destinationToken: destination,
  amount,
  destinationAccount: recipient,
  tradeType,
  originAccount: depositor,
}: QuoteRequest) => {
  const debouncedAmount = useDebounce(amount, 300);
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "swap-quote",
      origin,
      destination,
      debouncedAmount,
      tradeType,
      depositor.address,
      recipient.address,
    ],
    queryFn: (): Promise<SwapApprovalApiCallReturnType | undefined> => {
      if (Number(debouncedAmount) <= 0) {
        return Promise.resolve(undefined);
      }
      if (!origin || !destination || !debouncedAmount) {
        throw new Error("Missing required swap quote parameters");
      }

      const isUsingPlaceholderDepositor = !depositor;

      const params: SwapApprovalApiQueryParams = {
        tradeType: tradeType,
        inputToken: origin.address,
        outputToken: destination.address,
        originChainId: origin.chainId,
        destinationChainId: destination.chainId,
        depositor: depositor.address,
        recipient: recipient.address,
        amount: debouncedAmount.toString(),
        refundOnOrigin: true,
        // Skip transaction estimation when using placeholder address
        skipOriginTxEstimation: isUsingPlaceholderDepositor,
      };

      return swapApprovalApiCall(params);
    },
    enabled: !!origin?.address && !!destination?.address && !!amount,
    retry: 2,

    refetchInterval(query) {
      // only refetch if data
      return query.state.status === "success" ? 10_000 : false;
    },
  });

  return { data, isLoading, error };
};

export default useSwapQuote;
