import { useQuery } from "@tanstack/react-query";
import { BigNumber } from "ethers";
import {
  SwapApiToken,
  swapApprovalApiCall,
  SwapApprovalApiCallReturnType,
  SwapApprovalApiQueryParams,
} from "utils/serverless-api/prod/swap-approval";

type SwapQuoteParams = {
  origin: SwapApiToken | null;
  destination: SwapApiToken | null;
  amount: BigNumber | null;
  isInputAmount: boolean;
  depositor: string | undefined;
  recipient: string | undefined;
  integratorId?: string;
  refundAddress?: string;
  refundOnOrigin?: boolean;
  slippageTolerance?: number;
};

const useSwapQuote = ({
  origin,
  destination,
  amount,
  isInputAmount,
  recipient,
  integratorId,
  refundAddress,
  depositor,
  refundOnOrigin = true,
  slippageTolerance = 1,
}: SwapQuoteParams) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "swap-quote",
      origin,
      destination,
      amount,
      isInputAmount,
      depositor,
      recipient,
    ],
    queryFn: async (): Promise<SwapApprovalApiCallReturnType | undefined> => {
      if (Number(amount) <= 0) {
        return undefined;
      }
      if (!origin || !destination || !amount || !depositor) {
        throw new Error("Missing required swap quote parameters");
      }

      const params: SwapApprovalApiQueryParams = {
        tradeType: isInputAmount ? "exactInput" : "minOutput",
        inputToken: origin.address,
        outputToken: destination.address,
        originChainId: origin.chainId,
        destinationChainId: destination.chainId,
        depositor,
        recipient: recipient || depositor,
        amount: amount.toString(),
        refundOnOrigin,
        slippageTolerance,
        ...(integratorId ? { integratorId } : {}),
        ...(refundAddress ? { refundAddress } : {}),
      };

      const data = await swapApprovalApiCall(params);
      return data;
    },
    enabled:
      !!origin?.address && !!destination?.address && !!amount && !!depositor,
    retry: 2,

    refetchInterval(query) {
      // only refetch if data
      return query.state.status === "success" ? 10_000 : false;
    },
  });

  return { data, isLoading, error };
};

export default useSwapQuote;
