import { useMutation } from "@tanstack/react-query";
import {
  SwapApprovalActionStrategy,
  SwapApprovalData,
} from "./strategies/types";
import { DepositActionParams } from "views/Bridge/hooks/useBridgeAction/strategies/types";

export function createSwapApprovalActionHook(
  strategy: SwapApprovalActionStrategy
) {
  return function useSwapApprovalAction(
    approvalData?: SwapApprovalData,
    bridgeTxData?: DepositActionParams
  ) {
    const isConnected = strategy.isConnected();
    const isWrongNetwork = approvalData
      ? strategy.isWrongNetwork(approvalData.swapTx.chainId)
      : bridgeTxData
        ? strategy.isWrongNetwork(bridgeTxData.selectedRoute.fromChain)
        : false;

    const action = useMutation({
      mutationFn: async () => {
        if (!approvalData && !bridgeTxData) {
          throw new Error("Missing approval data or bridge tx data");
        }
        const txHash = await strategy.execute(approvalData, bridgeTxData);
        return txHash;
      },
    });

    const buttonDisabled =
      (!approvalData && !bridgeTxData) || (isConnected && action.isPending);

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
