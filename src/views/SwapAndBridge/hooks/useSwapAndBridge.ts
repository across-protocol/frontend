import { useMemo } from "react";

import { AmountInputError } from "../../Bridge/utils";
import useSwapQuote, { SwapQuote } from "./useSwapQuote";
import { useSwapApprovalAction } from "./useSwapApprovalAction";
import { useValidateSwapAndBridge } from "./useValidateSwapAndBridge";
import { getQuoteWarningMessage } from "utils";
import { useEcosystemAccounts } from "hooks/useEcosystemAccounts";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import type { ChainEcosystem } from "../../../constants/chains/types";
import { useOnConfirm } from "./useOnConfirm";
import { getPriceImpact, PriceImpact } from "../utils/fees";
import { BridgeButtonState } from "../components/Confirmation/ConfirmationButton";

export type UseSwapAndBridgeReturn = {
  swapQuote: SwapQuote;
  isQuoteLoading: boolean;
  expectedInputAmount?: string;
  expectedOutputAmount?: string;

  validationError?: AmountInputError;
  priceImpact?: PriceImpact;
  buttonState: BridgeButtonState;
  buttonDisabled: boolean;
  buttonLoading: boolean;
  buttonLabel: string;

  onConfirm: () => Promise<void>;
  destinationChainEcosystem: "svm" | "evm";
};

export function useSwapAndBridge(
  quoteRequest: QuoteRequest
): UseSwapAndBridgeReturn {
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

  const {
    data: swapQuote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useSwapQuote(quoteRequest);

  const approvalAction = useSwapApprovalAction(
    quoteRequest.originToken?.chainId || 0,
    swapQuote
  );

  const validation = useValidateSwapAndBridge(
    quoteRequest.amount,
    quoteRequest.tradeType === "exactInput",
    quoteRequest.originToken,
    quoteRequest.destinationToken,
    !!depositor,
    swapQuote?.inputAmount
  );

  const expectedInputAmount = useMemo(() => {
    return swapQuote?.inputAmount?.toString();
  }, [swapQuote]);

  const expectedOutputAmount = useMemo(() => {
    return swapQuote?.expectedOutputAmount?.toString();
  }, [swapQuote]);

  const priceImpact = getPriceImpact(swapQuote);
  const onConfirm = useOnConfirm(quoteRequest, approvalAction);

  // Button state logic
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
    swapQuote,
    isQuoteLoading,
    expectedInputAmount,
    expectedOutputAmount,
    validationError: validation.error,
    priceImpact,
    // Button state information
    buttonState,
    buttonDisabled,
    buttonLoading,
    buttonLabel,

    onConfirm,
    destinationChainEcosystem,
  };
}

const buttonLabels: Record<BridgeButtonState, string> = {
  notConnected: "Connect Wallet",
  readyToConfirm: "Confirm Swap",
  apiError: "Confirm Swap",
  submitting: "Confirming...",
  wrongNetwork: "Confirm Swap",
  loadingQuote: "Finalizing quote...",
  validationError: "Confirm Swap",
};
