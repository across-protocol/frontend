import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber } from "ethers";

import { AmountInputError } from "../../Bridge/utils";
import useSwapQuote from "./useSwapQuote";
import { EnrichedToken } from "../components/ChainTokenSelector/Modal";
import {
  useSwapApprovalAction,
  SwapApprovalData,
} from "./useSwapApprovalAction";
import { useValidateSwapAndBridge } from "./useValidateSwapAndBridge";
import { BridgeButtonState } from "../components/ConfirmationButton";
import { useDebounce } from "@uidotdev/usehooks";
import { useDefaultRoute } from "./useDefaultRoute";
import { useConnection } from "hooks";
import { useHistory } from "react-router-dom";

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

  swapQuote: ReturnType<typeof useSwapQuote>["data"];
  isQuoteLoading: boolean;
  expectedInputAmount?: string;
  expectedOutputAmount?: string;

  validationError?: AmountInputError;
  validationWarning?: AmountInputError;
  validationErrorFormatted?: string | undefined;

  // Button state information
  buttonState: BridgeButtonState;
  buttonDisabled: boolean;
  buttonLoading: boolean;
  buttonLabel: string;

  // Legacy properties
  isConnected: boolean;
  isWrongNetwork: boolean;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
};

export function useSwapAndBridge(): UseSwapAndBridgeReturn {
  const [inputToken, setInputToken] = useState<EnrichedToken | null>(null);
  const [outputToken, setOutputToken] = useState<EnrichedToken | null>(null);
  const [amount, setAmount] = useState<BigNumber | null>(null);
  const [isAmountOrigin, setIsAmountOrigin] = useState<boolean>(true);

  const debouncedAmount = useDebounce(amount, 300);
  const defaultRoute = useDefaultRoute();
  const { connect } = useConnection();
  const history = useHistory();

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
    error,
  } = useSwapQuote({
    origin: inputToken ? inputToken : null,
    destination: outputToken ? outputToken : null,
    amount: debouncedAmount,
    isInputAmount: isAmountOrigin,
  });

  const approvalData: SwapApprovalData | undefined = useMemo(() => {
    if (!swapQuote) return undefined;
    return {
      approvalTxns: swapQuote.approvalTxns,
      swapTx: swapQuote.swapTx as any,
    };
  }, [swapQuote]);

  const approvalAction = useSwapApprovalAction(
    inputToken?.chainId || 0,
    approvalData
  );

  const validation = useValidateSwapAndBridge(
    amount,
    isAmountOrigin,
    inputToken,
    outputToken,
    error
  );

  const expectedInputAmount = useMemo(() => {
    return swapQuote?.inputAmount?.toString();
  }, [swapQuote]);

  const expectedOutputAmount = useMemo(() => {
    return swapQuote?.expectedOutputAmount?.toString();
  }, [swapQuote]);

  const onConfirm = useCallback(async () => {
    // If not connected, open the wallet connection modal
    if (!approvalAction.isConnected) {
      connect({ trackSection: "bridgeForm" });
      return;
    }

    // Otherwise, proceed with the transaction
    const txHash = await approvalAction.buttonActionHandler();
    // Only navigate if we got a transaction hash (not empty string from wallet connection)
    if (txHash) {
      history.push(
        `/bridge/${txHash}?originChainId=${inputToken?.chainId}&destinationChainId=${outputToken?.chainId}&inputTokenSymbol=${inputToken?.symbol}&outputTokenSymbol=${outputToken?.symbol}&referrer=`
      );
    }
  }, [
    approvalAction,
    connect,
    history,
    inputToken?.chainId,
    inputToken?.symbol,
    outputToken?.chainId,
    outputToken?.symbol,
  ]);

  // Button state logic
  const buttonState: BridgeButtonState = useMemo(() => {
    if (isQuoteLoading) return "loadingQuote";
    if (!approvalAction.isConnected) return "notConnected";
    if (approvalAction.isButtonActionLoading) return "submitting";
    if (!inputToken || !outputToken) return "awaitingTokenSelection";
    if (!amount || amount.lte(0)) return "awaitingAmountInput";
    if (validation.error) return "validationError";
    return "readyToConfirm";
  }, [
    approvalAction.isButtonActionLoading,
    approvalAction.isConnected,
    inputToken,
    outputToken,
    amount,
    isQuoteLoading,
    validation.error,
  ]);

  const buttonLoading = useMemo(() => {
    return buttonState === "loadingQuote" || buttonState === "submitting";
  }, [buttonState]);

  const buttonLabel = useMemo(() => buttonLabels[buttonState], [buttonState]);

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

    // Legacy properties
    isConnected: approvalAction.isConnected,
    isWrongNetwork: approvalAction.isWrongNetwork,
    isSubmitting: approvalAction.isButtonActionLoading,
    onConfirm,
  };
}

const buttonLabels: Record<BridgeButtonState, string> = {
  notConnected: "Connect Wallet",
  awaitingTokenSelection: "Confirm Swap",
  awaitingAmountInput: "Confirm Swap",
  readyToConfirm: "Confirm Swap",
  submitting: "Confirming...",
  wrongNetwork: "Confirm Swap",
  loadingQuote: "Finalizing quote...",
  validationError: "Confirm Swap",
};
