import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { SwapApproval } from "./useSwapApprovalAction";
import { useConnectionEVM } from "../../../hooks/useConnectionEVM";
import { useConnectionSVM } from "../../../hooks/useConnectionSVM";
import { useEcosystemAccounts } from "../../../hooks/useEcosystemAccounts";
import { useCallback } from "react";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";
import { useTrackTransferSubmitted } from "./useTrackTransferSubmitted";
import { useTrackTransferSigned } from "./useTrackTransferSigned";

export function useOnConfirm(
  quoteRequest: QuoteRequest,
  approvalAction: SwapApproval,
  swapQuote: SwapApprovalQuote | undefined
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

  const { trackTransferSigned, setTransferSubmittedTimestamp } =
    useTrackTransferSigned({
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
    setTransferSubmittedTimestamp();

    // Proceed with the transaction
    const txHash = await approvalAction.buttonActionHandler();

    // Track transfer signed after successful execution
    if (txHash) {
      trackTransferSigned(txHash);
    }
  }, [
    depositor,
    recipient,
    originEcosystem,
    destinationEcosystem,
    approvalAction,
    connectEVM,
    connectSVM,
    trackTransferSubmitted,
    trackTransferSigned,
    setTransferSubmittedTimestamp,
  ]);
}
