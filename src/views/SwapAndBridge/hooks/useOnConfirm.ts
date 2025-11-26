import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { SwapApproval } from "./useSwapApprovalAction";
import { useConnectionEVM } from "../../../hooks/useConnectionEVM";
import { useConnectionSVM } from "../../../hooks/useConnectionSVM";
import { getEcosystemFromToken } from "../../../utils";
import { useCallback } from "react";

export function useOnConfirm(
  quoteRequest: QuoteRequest,
  approvalAction: SwapApproval
) {
  const { connect: connectEVM, isConnected: isConnectedEVM } =
    useConnectionEVM();
  const { connect: connectSVM, isConnected: isConnectedSVM } =
    useConnectionSVM();

  const originChainEcosystem = getEcosystemFromToken(quoteRequest.originToken);
  const destinationChainEcosystem = getEcosystemFromToken(
    quoteRequest.destinationToken
  );

  // Check if origin wallet is connected
  const isOriginConnected =
    originChainEcosystem === "evm" ? isConnectedEVM : isConnectedSVM;

  // Check if destination recipient is set (appropriate wallet connected for destination ecosystem)
  const isRecipientSet = quoteRequest.destinationAccount;

  return useCallback(async () => {
    // If origin wallet is not connected, connect it first
    if (!isOriginConnected) {
      if (originChainEcosystem === "evm") {
        connectEVM({ trackSection: "bridgeForm" });
        return;
      } else {
        connectSVM({ trackSection: "bridgeForm" });
        return;
      }
    }

    // If destination recipient is not set, connect the destination wallet
    if (!isRecipientSet) {
      if (destinationChainEcosystem === "evm") {
        connectEVM({ trackSection: "bridgeForm" });
        return;
      } else {
        connectSVM({ trackSection: "bridgeForm" });
        return;
      }
    }

    // Otherwise, proceed with the transaction
    await approvalAction.buttonActionHandler();
  }, [
    isOriginConnected,
    isRecipientSet,
    originChainEcosystem,
    destinationChainEcosystem,
    approvalAction,
    connectEVM,
    connectSVM,
  ]);
}
