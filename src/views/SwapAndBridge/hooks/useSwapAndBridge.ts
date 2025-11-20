import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber } from "ethers";

import { AmountInputError } from "../../Bridge/utils";
import useSwapQuote from "./useSwapQuote";
import { EnrichedToken } from "../components/ChainTokenSelector/ChainTokenSelectorModal";
import { useSwapApprovalAction } from "./useSwapApprovalAction";
import { useValidateSwapAndBridge } from "./useValidateSwapAndBridge";
import { BridgeButtonState } from "../components/ConfirmationButton";
import { useDebounce } from "@uidotdev/usehooks";
import { useDefaultRoute } from "./useDefaultRoute";
import { getEcosystem, getQuoteWarningMessage } from "utils";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useToAccount } from "views/Bridge/hooks/useToAccount";

export type UseSwapAndBridgeReturn = {
  inputToken: EnrichedToken | null;
  outputToken: EnrichedToken | null;
  setInputToken: (t: EnrichedToken | null) => void;
  setOutputToken: (t: EnrichedToken | null) => void;
  quickSwap: () => void;

  amount: BigNumber | null;
  setAmount: (a: BigNumber | null) => void;
  isAmountOrigin: boolean;
  setIsAmountOrigin: (v: boolean) => void;
  // route
  swapQuote: ReturnType<typeof useSwapQuote>["data"];
  isQuoteLoading: boolean;
  expectedInputAmount?: string;
  expectedOutputAmount?: string;
  destinationChainEcosystem: "svm" | "evm";
  // validation
  validationError?: AmountInputError;
  validationWarning?: AmountInputError;
  validationErrorFormatted?: string | undefined;

  // Button state information
  buttonState: BridgeButtonState;
  buttonDisabled: boolean;
  buttonLoading: boolean;
  buttonLabel: string;
  walletTypeToConnect?: "evm" | "svm"; // Which wallet type needs to be connected

  // Account management
  toAccountManagement: ReturnType<typeof useToAccount>;

  // Legacy properties
  isConnected: boolean;
  isWrongNetwork: boolean;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  quoteError: Error | null;
  quoteWarningMessage: string | null;
};

export function useSwapAndBridge(): UseSwapAndBridgeReturn {
  const [inputToken, setInputToken] = useState<EnrichedToken | null>(null);
  const [outputToken, setOutputToken] = useState<EnrichedToken | null>(null);
  const [amount, setAmount] = useState<BigNumber | null>(null);
  const [isAmountOrigin, setIsAmountOrigin] = useState<boolean>(true);

  const debouncedAmount = useDebounce(amount, 300);
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

  const toAccountManagement = useToAccount(outputToken?.chainId);

  const originChainEcosystem = inputToken?.chainId
    ? getEcosystem(inputToken?.chainId)
    : "evm";
  const destinationChainEcosystem = outputToken?.chainId
    ? getEcosystem(outputToken?.chainId)
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
      setInputToken((prev) => {
        // Only update if token is different (avoid unnecessary re-renders)
        if (
          !prev ||
          prev.address !== defaultRoute.inputToken!.address ||
          prev.chainId !== defaultRoute.inputToken!.chainId
        ) {
          return defaultRoute.inputToken;
        }
        return prev;
      });
      setOutputToken((prev) => {
        // Only update if token is different (avoid unnecessary re-renders)
        if (
          !prev ||
          prev.address !== defaultRoute.outputToken!.address ||
          prev.chainId !== defaultRoute.outputToken!.chainId
        ) {
          return defaultRoute.outputToken;
        }
        return prev;
      });
    }
  }, [defaultRoute]);

  const quickSwap = useCallback(() => {
    setInputToken((prevInput) => {
      const prevOut = outputToken;
      setOutputToken(prevInput || null);
      return prevOut || null;
    });
    setAmount(null);
  }, [outputToken]);

  const {
    data: swapQuote,
    isLoading: isQuoteLoading,
    error: quoteError,
  } = useSwapQuote({
    origin: inputToken ? inputToken : null,
    destination: outputToken ? outputToken : null,
    amount: debouncedAmount,
    isInputAmount: isAmountOrigin,
    depositor,
    recipient: toAccountManagement.currentRecipientAccount,
  });

  const approvalAction = useSwapApprovalAction(
    inputToken?.chainId || 0,
    swapQuote
  );

  const validation = useValidateSwapAndBridge(
    amount,
    isAmountOrigin,
    inputToken,
    outputToken,
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
      !inputToken ||
      !outputToken ||
      !amount ||
      amount.lte(0),
    [
      approvalAction.buttonDisabled,
      validation.error,
      inputToken,
      outputToken,
      amount,
    ]
  );

  return {
    inputToken,
    outputToken,
    setInputToken,
    setOutputToken,
    quickSwap,

    amount,
    setAmount,
    isAmountOrigin,
    setIsAmountOrigin,

    swapQuote,
    isQuoteLoading,
    expectedInputAmount,
    expectedOutputAmount,
    validationErrorFormatted: validation.errorFormatted,
    validationError: validation.error,
    validationWarning: validation.warn,

    // Button state information
    buttonState,
    buttonDisabled,
    buttonLoading,
    buttonLabel,
    walletTypeToConnect,

    // Account management
    toAccountManagement,
    destinationChainEcosystem,
    // Legacy properties
    isConnected: isOriginConnected && isRecipientSet,
    isWrongNetwork: approvalAction.isWrongNetwork,
    isSubmitting: approvalAction.isButtonActionLoading,
    onConfirm,
    quoteError,
    quoteWarningMessage,
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
