import { useQuery } from "@tanstack/react-query";
import { BigNumber } from "ethers";
import {
  SwapApiToken,
  swapApprovalApiCall,
  SwapApprovalApiCallReturnType,
  SwapApprovalApiQueryParams,
} from "utils/serverless-api/prod/swap-approval";
import { chainIsSvm } from "utils/sdk";

// Placeholder addresses for quote simulation when wallet is not connected
const PLACEHOLDER_EVM_ADDRESS = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
const PLACEHOLDER_SVM_ADDRESS = "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t";

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
  slippageTolerance = 0.05,
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
      if (!origin || !destination || !amount) {
        throw new Error("Missing required swap quote parameters");
      }

      // Use appropriate placeholder address based on chain ecosystem when wallet is not connected
      const getPlaceholderAddress = (chainId: number) => {
        return chainIsSvm(chainId)
          ? PLACEHOLDER_SVM_ADDRESS
          : PLACEHOLDER_EVM_ADDRESS;
      };

      const isUsingPlaceholderDepositor = !depositor;
      const effectiveDepositor =
        depositor || getPlaceholderAddress(origin.chainId);
      const effectiveRecipient =
        recipient || getPlaceholderAddress(destination.chainId);

      const params: SwapApprovalApiQueryParams = {
        tradeType: isInputAmount ? "exactInput" : "minOutput",
        inputToken: origin.address,
        outputToken: destination.address,
        originChainId: origin.chainId,
        destinationChainId: destination.chainId,
        depositor: effectiveDepositor,
        recipient: effectiveRecipient,
        amount: amount.toString(),
        refundOnOrigin,
        slippageTolerance,
        // Skip transaction estimation when using placeholder address
        skipOriginTxEstimation: isUsingPlaceholderDepositor,
        ...(integratorId ? { integratorId } : {}),
        ...(refundAddress ? { refundAddress } : {}),
      };

      const data = await swapApprovalApiCall(params);
      return data;
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
