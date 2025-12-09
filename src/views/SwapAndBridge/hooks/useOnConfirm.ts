import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { SwapApproval } from "./useSwapApprovalAction";
import { useConnectionEVM } from "../../../hooks/useConnectionEVM";
import { useConnectionSVM } from "../../../hooks/useConnectionSVM";
import { useEcosystemAccounts } from "../../../hooks/useEcosystemAccounts";
import { useCallback } from "react";

export function useOnConfirm(
  quoteRequest: QuoteRequest,
  approvalAction: SwapApproval
) {
  const { connect: connectEVM } = useConnectionEVM();
  const { connect: connectSVM } = useConnectionSVM();

  const { originEcosystem, depositor, recipient, destinationEcosystem } =
    useEcosystemAccounts({
      originToken: quoteRequest.originToken,
      destinationToken: quoteRequest.destinationToken,
    });

  return useCallback(async () => {
    // If origin wallet is not connected, connect it first
    if (!depositor) {
      if (originEcosystem === "evm") {
        connectEVM({ trackSection: "bridgeForm" });
        return;
      } else {
        connectSVM({ trackSection: "bridgeForm" });
        return;
      }
    }

    // If destination recipient is not set, connect the destination wallet
    if (!recipient) {
      if (destinationEcosystem === "evm") {
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
    depositor,
    recipient,
    originEcosystem,
    destinationEcosystem,
    approvalAction,
    connectEVM,
    connectSVM,
  ]);
}
