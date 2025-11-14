import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber } from "ethers";

import { AmountInputError } from "../../Bridge/utils";
import { useSwapAndBridgeQuote } from "./useSwapAndBridgeQuote";
import {
  useSwapApprovalAction,
  SwapApprovalData,
} from "./useSwapApprovalAction";
import { useValidateSwapAndBridge } from "./useValidateSwapAndBridge";
import { BridgeButtonState } from "../components/ConfirmationButton";
import { useDebounce } from "@uidotdev/usehooks";
import { useDefaultRoute } from "./useDefaultRoute";
import { useHistory } from "react-router-dom";
import { buildSearchParams, getEcosystem, getQuoteWarningMessage } from "utils";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { useToAccount } from "views/Bridge/hooks/useToAccount";
import { TokenWithBalance } from "./useSwapAndBridgeTokens";
import { findEnabledRoute } from "views/Bridge/utils";
import { DepositActionParams } from "views/Bridge/hooks/useBridgeAction/strategies/types";
import useReferrer from "hooks/useReferrer";
import { useAmplitude } from "hooks/useAmplitude";
import { ampli, DepositNetworkMismatchProperties } from "ampli";

export type UseSwapAndBridgeReturn = {
  inputToken: TokenWithBalance | null;
  outputToken: TokenWithBalance | null;
  setInputToken: (t: TokenWithBalance | null) => void;
  setOutputToken: (t: TokenWithBalance | null) => void;
  quickSwap: () => void;

  amount: BigNumber | null;
  setAmount: (a: BigNumber | null) => void;
  isAmountOrigin: boolean;
  setIsAmountOrigin: (v: boolean) => void;
  // route
  swapQuote: ReturnType<typeof useSwapAndBridgeQuote>["data"];
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
  const [inputToken, setInputToken] = useState<TokenWithBalance | null>(null);
  const [outputToken, setOutputToken] = useState<TokenWithBalance | null>(null);
  const [amount, setAmount] = useState<BigNumber | null>(null);
  const [isAmountOrigin, setIsAmountOrigin] = useState<boolean>(true);

  const debouncedAmount = useDebounce(amount, 300);
  const defaultRoute = useDefaultRoute();

  const history = useHistory();

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
  const { referrer, integratorId } = useReferrer();
  const { addToAmpliQueue } = useAmplitude();

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
    data: swapQuote, // normalized quote
    isLoading: isQuoteLoading,
    error: quoteError,
    bridgeQuoteResult,
  } = useSwapAndBridgeQuote({
    inputToken: inputToken,
    outputToken: outputToken,
    amount: debouncedAmount,
    isInputAmount: isAmountOrigin,
    depositor,
    recipient: toAccountManagement.currentRecipientAccount,
  });

  const swapTxData: SwapApprovalData | undefined = useMemo(() => {
    if (!swapQuote || swapQuote.quoteType !== "swap") return undefined;
    return {
      approvalTxns: swapQuote.approvalTxns,
      swapTx: swapQuote.swapTx,
    } as SwapApprovalData;
  }, [swapQuote]);

  // Compute selectedRoute for bridge quotes (similar to useSwapAndBridgeQuote)
  const selectedRouteForBridge = useMemo(() => {
    if (
      !swapQuote ||
      swapQuote.quoteType !== "bridge" ||
      !inputToken ||
      !outputToken
    ) {
      return undefined;
    }

    const toChain = outputToken.externalProjectId
      ? undefined
      : outputToken.chainId;

    return findEnabledRoute({
      inputTokenSymbol: inputToken.symbol,
      outputTokenSymbol: outputToken.symbol,
      fromChain: inputToken.chainId,
      toChain,
      externalProjectId: outputToken.externalProjectId,
      type: "bridge",
    });
  }, [swapQuote, inputToken, outputToken]);

  // Create bridgeTxData from bridgeQuoteResult when we have a bridge quote
  const bridgeTxData: DepositActionParams | undefined = useMemo(() => {
    if (
      !swapQuote ||
      swapQuote.quoteType !== "bridge" ||
      !bridgeQuoteResult ||
      !selectedRouteForBridge
    ) {
      return undefined;
    }

    const transferQuote = bridgeQuoteResult.transferQuoteQuery.data;
    if (!transferQuote || !transferQuote.quotedFees) {
      return undefined;
    }

    const { amountToBridgeAfterSwap, initialAmount, quotedFees, recipient } =
      transferQuote;

    if (!amountToBridgeAfterSwap || !initialAmount || !recipient) {
      return undefined;
    }

    const depositArgs = {
      initialAmount,
      amount: amountToBridgeAfterSwap,
      fromChain: selectedRouteForBridge.fromChain,
      toChain: selectedRouteForBridge.toChain,
      timestamp: quotedFees.quoteTimestamp,
      referrer: referrer || "",
      relayerFeePct: quotedFees.totalRelayFee.pct,
      inputTokenAddress: selectedRouteForBridge.fromTokenAddress,
      outputTokenAddress: selectedRouteForBridge.toTokenAddress,
      inputTokenSymbol: selectedRouteForBridge.fromTokenSymbol,
      outputTokenSymbol: selectedRouteForBridge.toTokenSymbol,
      fillDeadline: quotedFees.fillDeadline,
      isNative: selectedRouteForBridge.isNative,
      toAddress: recipient,
      exclusiveRelayer: quotedFees.exclusiveRelayer,
      exclusivityDeadline: quotedFees.exclusivityDeadline,
      integratorId,
      externalProjectId: selectedRouteForBridge.externalProjectId,
    };

    const onNetworkMismatch = (
      networkMismatchProperties: DepositNetworkMismatchProperties
    ) => {
      addToAmpliQueue(() => {
        ampli.depositNetworkMismatch(networkMismatchProperties);
      });
    };

    return {
      depositArgs,
      transferQuote,
      selectedRoute: selectedRouteForBridge,
      onNetworkMismatch,
    };
  }, [
    swapQuote,
    bridgeQuoteResult,
    selectedRouteForBridge,
    referrer,
    integratorId,
    addToAmpliQueue,
  ]);

  const approvalAction = useSwapApprovalAction(
    inputToken?.chainId || 0,
    swapTxData,
    bridgeTxData
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
    const txHash = await approvalAction.buttonActionHandler();
    // Only navigate if we got a transaction hash (not empty string from wallet connection)
    if (txHash) {
      const url =
        `/bridge-and-swap/${txHash}?` +
        buildSearchParams({
          originChainId: swapQuote?.inputToken?.chainId || "",
          destinationChainId:
            (selectedRouteForBridge
              ? selectedRouteForBridge.toChain
              : swapQuote?.outputToken.chainId) ?? "",
          inputTokenSymbol: swapQuote?.inputToken?.symbol || "",
          outputTokenSymbol: swapQuote?.outputToken?.symbol || "",
          externalProjectId: selectedRouteForBridge?.externalProjectId ?? "",
          referrer: "",
        });

      history.push(url);
    }
  }, [
    isOriginConnected,
    isRecipientSet,
    approvalAction,
    originChainEcosystem,
    connectEVM,
    connectSVM,
    destinationChainEcosystem,
    swapQuote?.inputToken?.chainId,
    swapQuote?.inputToken?.symbol,
    swapQuote?.outputToken.chainId,
    swapQuote?.outputToken?.symbol,
    selectedRouteForBridge,
    history,
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
    return getQuoteWarningMessage(quoteError || null);
  }, [quoteError]);

  const buttonLabel = useMemo(() => {
    // Show validation error in button label if present
    if (validation.errorFormatted && buttonState === "validationError") {
      return validation.errorFormatted;
    }

    // Show API error in button label if present
    if (quoteWarningMessage && buttonState === "apiError") {
      // todo: parse suggested fees errors
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
      // Only check approvalAction.buttonDisabled for swap quotes
      // For bridge quotes, approvalAction.buttonDisabled will be true because approvalData is undefined,
      // but we should still allow the button to be enabled if we have a valid bridge quote
      (swapQuote?.quoteType === "swap"
        ? approvalAction.buttonDisabled
        : false) ||
      !!validation.error ||
      !inputToken ||
      !outputToken ||
      !amount ||
      amount.lte(0) ||
      // Ensure we have a valid quote (for both swap and bridge quotes)
      !swapQuote,
    [
      approvalAction.buttonDisabled,
      validation.error,
      inputToken,
      outputToken,
      amount,
      swapQuote,
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
    quoteError: quoteError || null,
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
