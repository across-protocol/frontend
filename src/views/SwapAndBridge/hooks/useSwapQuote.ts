import { useQuery } from "@tanstack/react-query";
import {
  swapApprovalApiCall,
  SwapApprovalApiCallReturnType,
  SwapApprovalApiQueryParams,
} from "utils/serverless-api/prod/swap-approval";
import { useDebounce } from "@uidotdev/usehooks";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { INTEGRATOR_ID_ACROSS } from "utils";

export type SwapQuote = ReturnType<typeof useSwapQuote>["data"];

const useSwapQuote = ({
  amount,
  destinationAccount,
  destinationToken,
  originAccount,
  originToken,
  tradeType,
}: QuoteRequest) => {
  const debouncedAmount = useDebounce(amount, 300);
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "swap-quote",
      originToken,
      destinationToken,
      debouncedAmount,
      tradeType,
      originAccount.address,
      destinationAccount.address,
    ],
    queryFn: (): Promise<SwapApprovalApiCallReturnType | undefined> => {
      if (Number(debouncedAmount) <= 0) {
        return Promise.resolve(undefined);
      }
      if (!originToken || !destinationToken || !debouncedAmount) {
        throw new Error("Missing required swap quote parameters");
      }

      const isUsingPlaceholderDepositor = !originAccount;

      const params: SwapApprovalApiQueryParams = {
        tradeType: tradeType,
        inputToken: originToken.address,
        outputToken: destinationToken.address,
        originChainId: originToken.chainId,
        destinationChainId: destinationToken.chainId,
        depositor: originAccount.address,
        recipient: destinationAccount.address,
        amount: debouncedAmount.toString(),
        refundOnOrigin: true,
        skipOriginTxEstimation: isUsingPlaceholderDepositor,
        integratorId: INTEGRATOR_ID_ACROSS,
      };

      return swapApprovalApiCall(params);
    },
    enabled: !!originToken?.address && !!destinationToken?.address && !!amount,
    retry: 2,
    refetchInterval: (query) =>
      query.state.status === "success" ? 10_000 : false,
  });

  return { data, isLoading, error };
};

export default useSwapQuote;
