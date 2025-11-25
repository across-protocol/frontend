import { useCallback, useEffect, useMemo, useState } from "react";

import { AmountInputError } from "../../Bridge/utils";
import useSwapQuote from "./useSwapQuote";
import { useSwapApprovalAction } from "./useSwapApprovalAction";
import { useValidateSwapAndBridge } from "./useValidateSwapAndBridge";
import { BridgeButtonState } from "../components/ConfirmationButton";
import { useDebounce } from "@uidotdev/usehooks";
import { useDefaultRoute } from "./useDefaultRoute";
import { getEcosystem, getQuoteWarningMessage } from "utils";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useToAccount } from "views/Bridge/hooks/useToAccount";
import { QuoteRequest } from "./useQuoteReqest/quoteRequestAction";
import { EnrichedToken } from "../components/ChainTokenSelector/ChainTokenSelectorModal";

export type UseSwapAndBridgeReturn = {
  isAmountOrigin: boolean;
  setIsAmountOrigin: (v: boolean) => void;
  // route
  swapQuote: ReturnType<typeof useSwapQuote>["data"];
  isQuoteLoading: boolean;
  expectedInputAmount?: string;
  expectedOutputAmount?: string;

  validationError?: AmountInputError;
  buttonState: BridgeButtonState;
  buttonDisabled: boolean;
  buttonLoading: boolean;
  buttonLabel: string;

  onConfirm: () => Promise<void>;
  destinationChainEcosystem: "svm" | "evm";
  toAccountManagement: ReturnType<typeof useToAccount>;
};

export function useSwapAndBridge(
  quoteRequest: QuoteRequest,
  setInputToken: (token: EnrichedToken | null) => void,
  setOutputToken: (token: EnrichedToken | null) => void
): UseSwapAndBridgeReturn {
  const [isAmountOrigin, setIsAmountOrigin] = useState<boolean>(true);

  const debouncedAmount = useDebounce(quoteRequest.amount, 300);
  const defaultRoute = useDefaultRoute();

  const {
    account: accountEVM,
    connect: connectEVM,
    isConnected: isConnectedEVM,
  } = useConnectionEVM();
  const {
    account: accountSVM,
    connect: connectSVM,
    isConnected: isConnectedSVM,
  } = useConnectionSVM();

  const toAccountManagement = useToAccount(
    quoteRequest.destinationToken?.chainId
  );

  const originChainEcosystem = quoteRequest.originToken?.chainId
    ? getEcosystem(quoteRequest.originToken?.chainId)
    : "evm";
  const destinationChainEcosystem = quoteRequest.destinationToken?.chainId
    ? getEcosystem(quoteRequest.destinationToken?.chainId)
    : "evm";

  const depositor =
    originChainEcosystem === "evm" ? accountEVM : accountSVM?.toBase58();

  // Check if origin wallet is connected
  const isOriginConnected =
    originChainEcosystem === "evm" ? isConnectedEVM : isConnectedSVM;

  // Check if destination recipient is set (appropriate wallet connected for destination ecosystem)
  const isRecipientSet =
    destinationChainEcosystem === "evm"
      ? !!toAccountManagement.toAccountEVM
      : !!toAccountManagement.toAccountSVM;

  // Determine which wallet type needs to be connected (if any)
  const walletTypeToConnect: "evm" | "svm" | undefined = (() => {
    if (!isOriginConnected) {
      return originChainEcosystem;
    }
    if (!isRecipientSet) {
      return destinationChainEcosystem;
    }
    return undefined;
  })();

  useEffect(() => {
    if (defaultRoute.inputToken && defaultRoute.outputToken) {
      if (
        !quoteRequest.originToken ||
        quoteRequest.originToken.address !== defaultRoute.inputToken!.address ||
        quoteRequest.originToken.chainId !== defaultRoute.inputToken!.chainId
      ) {
        return setInputToken(defaultRoute.inputToken);
      }

      if (
        !quoteRequest.destinationToken ||
        quoteRequest.destinationToken.address !==
          defaultRoute.outputToken!.address ||
        quoteRequest.destinationToken.chainId !==
          defaultRoute.outputToken!.chainId
      ) {
        return setOutputToken(defaultRoute.outputToken);
      }
    }
  }, [
    defaultRoute,
    quoteRequest.destinationToken,
    quoteRequest.originToken,
    setInputToken,
    setOutputToken,
  ]);

  const {
    data: swapQuote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useSwapQuote({
    origin: quoteRequest.originToken ? quoteRequest.originToken : null,
    destination: quoteRequest.destinationToken
      ? quoteRequest.destinationToken
      : null,
    amount: debouncedAmount,
    isInputAmount: isAmountOrigin,
    depositor,
    recipient: toAccountManagement.currentRecipientAccount,
  });

  const approvalAction = useSwapApprovalAction(
    quoteRequest.originToken?.chainId || 0,
    swapQuote
  );

  const validation = useValidateSwapAndBridge(
    quoteRequest.amount,
    isAmountOrigin,
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

  const onConfirm = useCallback(async () => {
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
    isAmountOrigin,
    setIsAmountOrigin,
    swapQuote,
    isQuoteLoading,
    expectedInputAmount,
    expectedOutputAmount,
    validationError: validation.error,
    // Button state information
    buttonState,
    buttonDisabled,
    buttonLoading,
    buttonLabel,

    onConfirm,
    destinationChainEcosystem,
    toAccountManagement,
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
