import { useMutation } from "@tanstack/react-query";
import { SwapApprovalActionStrategy } from "./strategies/types";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";
import { useHistory } from "react-router-dom";
import { buildSearchParams } from "utils";
import useReferrer from "hooks/useReferrer";
import { createFromBridgeAndSwapPagePayload } from "utils/local-deposits";

export function createSwapApprovalActionHook(
  strategy: SwapApprovalActionStrategy
) {
  return function useSwapApprovalAction(swapQuote?: SwapApprovalQuote) {
    const history = useHistory();
    const { referrer } = useReferrer();
    const isConnected = strategy.isConnected();
    const isWrongNetwork = swapQuote
      ? strategy.isWrongNetwork(swapQuote.swapTx.chainId)
      : false;

    const action = useMutation({
      mutationFn: async () => {
        if (!swapQuote) throw new Error("Missing approval data");
        const txHash = await strategy.execute(swapQuote);
        const url =
          `/bridge-and-swap/${txHash}?` +
          buildSearchParams({
            originChainId: swapQuote?.inputToken?.chainId || "",
            destinationChainId: swapQuote?.outputToken.chainId || "",
            inputTokenSymbol: swapQuote?.inputToken?.symbol || "",
            outputTokenSymbol: swapQuote?.outputToken?.symbol || "",
            referrer,
            bridgeProvider: swapQuote?.steps.bridge.provider || "across",
          });

        const fromBridgeAndSwapPagePayload =
          createFromBridgeAndSwapPagePayload(swapQuote);
        if (txHash) {
          history.push(url, { fromBridgeAndSwapPagePayload });
        }
        return txHash;
      },
    });

    const buttonDisabled = !swapQuote || (isConnected && action.isPending);

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
