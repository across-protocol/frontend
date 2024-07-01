import { useEffect, useState } from "react";
import { BigNumber } from "ethers";

import { useConnection, useIsWrongNetwork, useAmplitude } from "hooks";
import { ampli } from "ampli";
import { defaultSwapSlippage, bnZero } from "utils";

import { useBridgeAction } from "./useBridgeAction";
import { useToAccount } from "./useToAccount";
import { useSelectRoute } from "./useSelectRoute";
import { useTransferQuote, type TransferQuote } from "./useTransferQuote";
import { useAmountInput } from "./useAmountInput";
import { validateBridgeAmount } from "../utils";

export function useBridge() {
  const [shouldUpdateQuote, setShouldUpdateQuote] = useState(true);
  const [usedTransferQuote, setUsedTransferQuote] = useState<TransferQuote>();

  const [swapSlippage, setSwapSlippage] = useState(defaultSwapSlippage);

  const { isConnected, chainId: walletChainId, account } = useConnection();

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

  const { toAccount, setCustomToAddress } = useToAccount(selectedRoute.toChain);

  const { transferQuoteQuery, limitsQuery } = useTransferQuote(
    selectedRoute,
    parsedAmount?.gt(0) ? parsedAmount : bnZero,
    swapSlippage,
    account,
    toAccount?.address
  );
  const {
    data: transferQuote,
    isLoading: isQuoteLoading,
    isFetching: isQuoteFetching,
    isIdle: isQuoteIdle,
  } = transferQuoteQuery;

  const { quotedFees, quotedSwap, estimatedTime } = usedTransferQuote || {};

  const isQuoteUpdating =
    shouldUpdateQuote &&
    (isQuoteLoading || isQuoteFetching || Boolean(parsedAmount && isQuoteIdle));

  const { error: amountValidationError } = validateBridgeAmount(
    parsedAmount,
    quotedFees?.isAmountTooLow,
    maxBalance,
    limitsQuery.limits?.maxDeposit,
    selectedRoute.type === "swap" && quotedSwap?.minExpectedInputTokenAmount
      ? BigNumber.from(quotedSwap?.minExpectedInputTokenAmount)
      : parsedAmount
  );
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
  }, [selectedRoute.fromChain, isConnected, checkWrongNetworkHandler]);

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

  return {
    ...bridgeAction,
    setCustomToAddress,
    selectedRoute,
    toAccount,
    walletAccount: account,
    limits: limitsQuery.limits,
    fees: quotedFees,
    swapQuote: quotedSwap,
    balance,
    handleQuickSwap,
    isWrongChain: isWrongNetwork,
    handleChainSwitch: isWrongNetworkHandler,
    walletChainId,
    isConnected,
    isBridgeDisabled: isConnected && bridgeAction.buttonDisabled,
    parsedAmountInput: parsedAmount,
    estimatedTimeString,
    handleChangeAmountInput,
    handleClickMaxBalance,
    userAmountInput,
    swapSlippage,
    amountValidationError,
    handleSelectFromChain,
    handleSelectToChain,
    handleSelectInputToken,
    handleSelectOutputToken,
    handleSetNewSlippage: setSwapSlippage,
    isQuoteLoading: isQuoteUpdating,
  };
}
