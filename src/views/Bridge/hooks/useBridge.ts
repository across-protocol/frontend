import { useEffect, useState } from "react";
import { BigNumber } from "ethers";

import { useIsWrongNetwork, useAmplitude } from "hooks";
import { useConnectionEVM } from "hooks/useConnectionEVM";
import { useConnectionSVM } from "hooks/useConnectionSVM";
import { ampli } from "ampli";
import { defaultSwapSlippage, bnZero, getEcosystem } from "utils";

import { useBridgeAction } from "./useBridgeAction_new";
import { useToAccount } from "./useToAccount";
import { useSelectRoute } from "./useSelectRoute";
import { useTransferQuote, type TransferQuote } from "./useTransferQuote";
import { useAmountInput } from "./useAmountInput";
import { validateBridgeAmount } from "../utils";

export function useBridge() {
  const [shouldUpdateQuote, setShouldUpdateQuote] = useState(true);
  const [usedTransferQuote, setUsedTransferQuote] = useState<TransferQuote>();

  const [swapSlippage, setSwapSlippage] = useState(defaultSwapSlippage);

  const {
    isConnected: isConnectedEVM,
    chainId: walletChainIdEVM,
    account: accountEVM,
  } = useConnectionEVM();
  const { isConnected: isConnectedSVM, account: accountSVM } =
    useConnectionSVM();

  const { addToAmpliQueue } = useAmplitude();

  const {
    selectedRoute,
    handleQuickSwap,
    handleSelectFromChain,
    handleSelectToChain,
    handleSelectInputToken,
    handleSelectOutputToken,
  } = useSelectRoute();

  const {
    handleChangeAmountInput,
    handleClickMaxBalance,
    userAmountInput,
    parsedAmount,
    balance,
    maxBalance,
  } = useAmountInput(selectedRoute);

  const originChainEcosystem = getEcosystem(selectedRoute.fromChain);
  const destinationChainEcosystem = getEcosystem(selectedRoute.toChain);

  const {
    toAccountEVM,
    toAccountSVM,
    handleChangeToAddressEVM,
    handleChangeToAddressSVM,
  } = useToAccount(selectedRoute.toChain);

  const depositor =
    originChainEcosystem === "evm" ? accountEVM : accountSVM?.toBase58();
  const recipient =
    destinationChainEcosystem === "evm" ? toAccountEVM : toAccountSVM;

  const {
    transferQuoteQuery,
    limitsQuery,
    feesQuery,
    swapQuoteQuery,
    universalSwapQuoteQuery,
  } = useTransferQuote(
    selectedRoute,
    parsedAmount?.gt(0) ? parsedAmount : bnZero,
    swapSlippage,
    depositor,
    recipient?.address
  );
  const { data: transferQuote } = transferQuoteQuery;

  const {
    quotedFees,
    quotedSwap,
    quotedLimits,
    estimatedTime,
    quotedUniversalSwap,
  } = usedTransferQuote || {};

  const isQuoteUpdating =
    shouldUpdateQuote &&
    (transferQuoteQuery.isLoading ||
      feesQuery.isLoading ||
      (selectedRoute.type === "swap" ? swapQuoteQuery.isLoading : false) ||
      (selectedRoute.type === "universal-swap"
        ? universalSwapQuoteQuery.isLoading
        : false)) &&
    !transferQuote;

  const { error: amountValidationError, warn: amountValidationWarning } =
    validateBridgeAmount({
      selectedRoute,
      parsedAmountInput: parsedAmount,
      quoteFees: quotedFees,
      currentBalance: maxBalance,
      maxDeposit: limitsQuery.limits?.maxDeposit,
      amountToBridgeAfterSwap:
        selectedRoute.type === "swap" && quotedSwap?.minExpectedInputTokenAmount
          ? BigNumber.from(quotedSwap?.minExpectedInputTokenAmount)
          : selectedRoute.type === "universal-swap" && quotedUniversalSwap
            ? quotedUniversalSwap?.steps.bridge.inputAmount
            : parsedAmount,
      universalSwapQuoteError: universalSwapQuoteQuery.error ?? undefined,
    });
  const isAmountValid = !amountValidationError;

  const {
    isWrongNetwork,
    isWrongNetworkHandlerWithoutError: isWrongNetworkHandler,
    checkWrongNetworkHandler,
  } = useIsWrongNetwork(selectedRoute.fromChain);

  const bridgeAction = useBridgeAction(
    isQuoteUpdating,
    selectedRoute,
    isAmountValid ? usedTransferQuote : undefined
  );

  useEffect(() => {
    checkWrongNetworkHandler();
  }, [selectedRoute.fromChain, checkWrongNetworkHandler]);

  useEffect(() => {
    if (!isQuoteUpdating && shouldUpdateQuote) {
      setUsedTransferQuote(transferQuote);

      if (transferQuote?.quoteForAnalytics) {
        addToAmpliQueue(() => {
          ampli.transferQuoteReceived(transferQuote?.quoteForAnalytics);
        });
      }
    }
  }, [transferQuote, shouldUpdateQuote, isQuoteUpdating, addToAmpliQueue]);

  useEffect(() => {
    if (shouldUpdateQuote && bridgeAction.isButtonActionLoading) {
      setShouldUpdateQuote(false);
    } else if (
      (bridgeAction.didActionError || !bridgeAction.isButtonActionLoading) &&
      !shouldUpdateQuote
    ) {
      setShouldUpdateQuote(true);
    }
  }, [
    shouldUpdateQuote,
    bridgeAction.isButtonActionLoading,
    bridgeAction.didActionError,
  ]);

  const estimatedTimeString = estimatedTime?.formattedString;
  const isConnected =
    originChainEcosystem === "evm" ? isConnectedEVM : isConnectedSVM;

  return {
    ...bridgeAction,
    handleChangeToAddressEVM,
    handleChangeToAddressSVM,
    selectedRoute,
    toAccountEVM,
    toAccountSVM,
    walletAccount: accountEVM,
    limits: transferQuote ? quotedLimits : limitsQuery.limits,
    fees: quotedFees,
    swapQuote: quotedSwap,
    universalSwapQuote: quotedUniversalSwap,
    balance,
    handleQuickSwap,
    isWrongChain: isWrongNetwork,
    handleChainSwitch: isWrongNetworkHandler,
    walletChainId: walletChainIdEVM,
    isConnected,
    isBridgeDisabled: isConnected && bridgeAction.buttonDisabled,
    parsedAmountInput: parsedAmount,
    estimatedTimeString,
    handleChangeAmountInput,
    handleClickMaxBalance,
    userAmountInput,
    swapSlippage,
    amountValidationError,
    amountValidationWarning,
    handleSelectFromChain,
    handleSelectToChain,
    handleSelectInputToken,
    handleSelectOutputToken,
    handleSetNewSlippage: setSwapSlippage,
    isQuoteLoading: isQuoteUpdating,
  };
}
