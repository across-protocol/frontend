import { useMutation } from "@tanstack/react-query";
import {
  SwapApprovalActionStrategy,
  SwapApprovalData,
} from "./strategies/types";

export function createSwapApprovalActionHook(
  strategy: SwapApprovalActionStrategy
) {
  return function useSwapApprovalAction(approvalData?: SwapApprovalData) {
    const isConnected = strategy.isConnected();
    const isWrongNetwork = approvalData
      ? strategy.isWrongNetwork(approvalData.swapTx.chainId)
      : false;

    const action = useMutation({
      mutationFn: async () => {
        if (!approvalData) throw new Error("Missing approval data");
        const txHash = await strategy.execute(approvalData);
        return txHash;
      },
    });

    const buttonDisabled = !approvalData || (isConnected && action.isPending);

    return {
      isConnected,
      isWrongNetwork,
      buttonActionHandler: action.mutateAsync,
      isButtonActionLoading: action.isPending,
      didActionError: action.isError,
      buttonDisabled,
    };
  };
}
