import { useQuery } from "@tanstack/react-query";
import {
  swapApprovalApiCall,
  SwapApprovalApiCallReturnType,
  SwapApprovalApiQueryParams,
} from "utils/serverless-api/prod/swap-approval";
import { useDebounce } from "@uidotdev/usehooks";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { getEcosystemFromToken, INTEGRATOR_ID_ACROSS } from "utils";
import { useConnectionEVM } from "../../../hooks/useConnectionEVM";
import { useConnectionSVM } from "../../../hooks/useConnectionSVM";

export type SwapQuote = ReturnType<typeof useSwapQuote>["data"];

// Placeholder addresses for quote simulation when wallet is not connected
export const PLACEHOLDER_EVM_ADDRESS =
  "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
export const PLACEHOLDER_SVM_ADDRESS =
  "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t";

const useSwapQuote = ({
  amount,
  customDestinationAccount,
  destinationToken,
  originToken,
  tradeType,
}: QuoteRequest) => {
  const { account: accountEVM } = useConnectionEVM();
  const { account: accountSVM } = useConnectionSVM();

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
      const originEcosystem = getEcosystemFromToken(originToken);
      const destinationEcosystem = getEcosystemFromToken(destinationToken);
      const depositor =
        originEcosystem === "evm" ? accountEVM : accountSVM?.toBase58();
      const placeholderAddress =
        originEcosystem === "evm"
          ? PLACEHOLDER_EVM_ADDRESS
          : PLACEHOLDER_SVM_ADDRESS;

      const recipient = customDestinationAccount
        ? customDestinationAccount.address
        : destinationEcosystem === "evm"
          ? accountEVM
          : accountSVM?.toBase58() || PLACEHOLDER_SVM_ADDRESS;

      if (Number(debouncedAmount) <= 0) {
        return Promise.resolve(undefined);
      }
      if (!originToken || !destinationToken || !debouncedAmount) {
        throw new Error("Missing required swap quote parameters");
      }

      const isUsingPlaceholderDepositor = !depositor;

      const params: SwapApprovalApiQueryParams = {
        tradeType: tradeType,
        inputToken: originToken.address,
        outputToken: destinationToken.address,
        originChainId: originToken.chainId,
        destinationChainId: destinationToken.chainId,
        depositor: depositor || placeholderAddress,
        recipient: recipient || placeholderAddress,
        amount: debouncedAmount.toString(),
        refundOnOrigin: true,
        skipOriginTxEstimation: isUsingPlaceholderDepositor,
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
