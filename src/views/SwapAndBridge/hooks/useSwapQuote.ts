import { useQuery } from "@tanstack/react-query";
import {
  swapApprovalApiCall,
  SwapApprovalApiCallReturnType,
  SwapApprovalApiQueryParams,
} from "utils/serverless-api/prod/swap-approval";
import { useDebounce } from "@uidotdev/usehooks";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { INTEGRATOR_ID_ACROSS } from "utils";
import { useEcosystemAccounts } from "../../../hooks/useEcosystemAccounts";

export type SwapQuote = ReturnType<typeof useSwapQuote>["data"];

const useSwapQuote = ({
  amount,
  customDestinationAccount,
  destinationToken,
  originToken,
  tradeType,
}: QuoteRequest) => {
  const { depositor, depositorOrPlaceholder, recipientOrPlaceholder } =
    useEcosystemAccounts({
      originToken,
      destinationToken,
      customDestinationAccount,
    });

  const debouncedAmount = useDebounce(amount, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "swap-quote",
      debouncedAmount,
      customDestinationAccount?.address,
      destinationToken?.address,
      originToken?.address,
      tradeType,
    ],
    queryFn: (): Promise<SwapApprovalApiCallReturnType | undefined> => {
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
        recipient: recipientOrPlaceholder,
        amount: debouncedAmount.toString(),
        refundOnOrigin: true,
        skipOriginTxEstimation: !depositor,
        integratorId: INTEGRATOR_ID_ACROSS,
      };

      return swapApprovalApiCall(params);
    },
    enabled:
      !!originToken?.address &&
      !!destinationToken?.address &&
      !!debouncedAmount,
    retry: 2,
    refetchInterval: (query) =>
      query.state.status === "success" ? 10_000 : false,
  });

  return { data, isLoading, error };
};

export default useSwapQuote;
