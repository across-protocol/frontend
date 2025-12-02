import { useMemo } from "react";

import { AmountInputError } from "../../Bridge/utils";
import useSwapQuote, { SwapQuote } from "./useSwapQuote";
import { useSwapApprovalAction } from "./useSwapApprovalAction";
import { useValidateSwapAndBridge } from "./useValidateSwapAndBridge";
import { getEcosystemFromToken, getQuoteWarningMessage } from "utils";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
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
  const isRecipientSet = quoteRequest.destinationAccount;
  const { isConnected: isConnectedEVM } = useConnectionEVM();
  const { isConnected: isConnectedSVM } = useConnectionSVM();

  const originChainEcosystem = getEcosystemFromToken(quoteRequest.originToken);
  const destinationChainEcosystem = getEcosystemFromToken(
    quoteRequest.destinationToken
  );

  // Check if origin wallet is connected
  const isOriginConnected =
    originChainEcosystem === "evm" ? isConnectedEVM : isConnectedSVM;

  // Check if destination recipient is set (appropriate wallet connected for destination ecosystem)

  // Determine which wallet type needs to be connected (if any)
  const walletTypeToConnect: ChainEcosystem | undefined = (() => {
    if (!isOriginConnected) {
      return originChainEcosystem;
    }
    if (!isRecipientSet) {
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
    isOriginConnected,
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
    if (!isOriginConnected || !isRecipientSet) return "notConnected";
    return "readyToConfirm";
  }, [
    isQuoteLoading,
    quoteError,
    isOriginConnected,
    isRecipientSet,
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
      // If neither wallet is connected, show generic "Connect Wallet"
      if (!isConnectedEVM && !isConnectedSVM) {
        return "Connect Wallet";
      }
      // Otherwise, show the specific wallet type that needs to be connected
      return walletTypeToConnect === "evm"
        ? "Connect EVM Wallet"
        : "Connect SVM Wallet";
    }
    return buttonLabels[buttonState];
  }, [
    buttonState,
    walletTypeToConnect,
    isConnectedEVM,
    isConnectedSVM,
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
