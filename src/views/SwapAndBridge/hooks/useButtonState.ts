import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { SwapApproval } from "./useSwapApprovalAction";
import { ValidationResult } from "./useValidateSwapAndBridge";
import { useEcosystemAccounts } from "../../../hooks/useEcosystemAccounts";
import type { ChainEcosystem } from "../../../constants/chains/types";
import { BridgeButtonState } from "../components/Confirmation/ConfirmationButton";
import { useMemo } from "react";
import { getQuoteWarningMessage } from "../../../utils";

const buttonLabels: Record<BridgeButtonState, string> = {
  notConnected: "Connect Wallet",
  readyToConfirm: "Confirm Swap",
  apiError: "Confirm Swap",
  submitting: "Confirming...",
  wrongNetwork: "Confirm Swap",
  loadingQuote: "Finalizing quote...",
  validationError: "Confirm Swap",
};

export const useButtonState = (
  quoteRequest: QuoteRequest,
  approvalAction: SwapApproval,
  validation: ValidationResult,
  quoteError: Error | null,
  isQuoteLoading: boolean
) => {
  const {
    depositor,
    recipient,
    originEcosystem,
    destinationEcosystem: destinationChainEcosystem,
  } = useEcosystemAccounts({
    originToken: quoteRequest.originToken,
    destinationToken: quoteRequest.destinationToken,
    customDestinationAccount: quoteRequest.customDestinationAccount,
  });

  const walletTypeToConnect: ChainEcosystem | undefined = (() => {
    if (!depositor) {
      return originEcosystem;
    }
    if (!recipient) {
      return destinationChainEcosystem;
    }
    return undefined;
  })();

  const buttonState: BridgeButtonState = useMemo(() => {
    if (approvalAction.isButtonActionLoading) return "submitting";
    if (isQuoteLoading) return "loadingQuote";
    if (quoteError) return "apiError";
    if (validation.error) return "validationError";
    if (!depositor || !recipient) return "notConnected";
    return "readyToConfirm";
  }, [
    isQuoteLoading,
    quoteError,
    depositor,
    recipient,
    approvalAction.isButtonActionLoading,
    validation.error,
  ]);

  const buttonLoading = useMemo(() => {
    return buttonState === "loadingQuote" || buttonState === "submitting";
  }, [buttonState]);

  const quoteWarningMessage = useMemo(() => {
    return getQuoteWarningMessage(quoteError);
  }, [quoteError]);

  const buttonLabel = useMemo(() => {
    // Show validation error in button label if present
    if (validation.errorFormatted && buttonState === "validationError") {
      return validation.errorFormatted;
    }

    // Show API error in button label if present
    if (quoteWarningMessage && buttonState === "apiError") {
      return quoteWarningMessage;
    }

    if (buttonState === "notConnected" && walletTypeToConnect) {
      if (!depositor && !recipient) {
        return "Connect Wallet";
      }
      return walletTypeToConnect === "evm"
        ? "Connect EVM Wallet"
        : "Connect SVM Wallet";
    }
    return buttonLabels[buttonState];
  }, [
    buttonState,
    walletTypeToConnect,
    depositor,
    recipient,
    validation.errorFormatted,
    quoteWarningMessage,
  ]);

  const buttonDisabled = useMemo(
    () =>
      approvalAction.buttonDisabled ||
      !!validation.error ||
      !quoteRequest.originToken ||
      !quoteRequest.destinationToken ||
      !quoteRequest.amount ||
      quoteRequest.amount.lte(0),
    [
      approvalAction.buttonDisabled,
      validation.error,
      quoteRequest.originToken,
      quoteRequest.destinationToken,
      quoteRequest.amount,
    ]
  );

  return {
    buttonState,
    buttonDisabled,
    buttonLoading,
    buttonLabel,
  };
};
