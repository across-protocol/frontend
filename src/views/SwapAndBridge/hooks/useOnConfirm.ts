import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { SwapApproval } from "./useSwapApprovalAction";
import { useConnectionEVM } from "../../../hooks/useConnectionEVM";
import { useConnectionSVM } from "../../../hooks/useConnectionSVM";
import { useEcosystemAccounts } from "../../../hooks/useEcosystemAccounts";
import { useCallback } from "react";
import { SwapApprovalApiCallReturnType } from "utils/serverless-api/prod/swap-approval";
import { useTrackTransferSubmitted } from "./useTrackTransferSubmitted";

export function useOnConfirm(
  quoteRequest: QuoteRequest,
  approvalAction: SwapApproval,
  swapQuote: SwapApprovalApiCallReturnType | undefined
) {
  const { connect: connectEVM } = useConnectionEVM();
  const { connect: connectSVM } = useConnectionSVM();

  const {
    originEcosystem,
    depositor,
    depositorOrPlaceholder,
    recipient,
    recipientOrPlaceholder,
    destinationEcosystem,
  } = useEcosystemAccounts({
    originToken: quoteRequest.originToken,
    destinationToken: quoteRequest.destinationToken,
    customDestinationAccount: quoteRequest.customDestinationAccount,
  });

  const { trackTransferSubmitted } = useTrackTransferSubmitted({
    quote: swapQuote,
    quoteRequest,
    depositorOrPlaceholder,
    recipientOrPlaceholder,
    customDestinationAddress: quoteRequest.customDestinationAccount?.address,
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

    // Track transfer submitted before executing
    trackTransferSubmitted();

    // Proceed with the transaction
    await approvalAction.buttonActionHandler();
  }, [
    depositor,
    recipient,
    originEcosystem,
    destinationEcosystem,
    approvalAction,
    connectEVM,
    connectSVM,
    trackTransferSubmitted,
  ]);
}
