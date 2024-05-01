import { useEffect, useState } from "react";
import { utils } from "@across-protocol/sdk-v2";
import { BigNumber } from "ethers";

import { useConnection, useIsWrongNetwork, useAmplitude } from "hooks";
import { ampli } from "ampli";

import { useBridgeAction } from "./useBridgeAction";
import { useToAccount } from "./useToAccount";
import { useSelectRoute } from "./useSelectRoute";
import { useTransferQuote, type TransferQuote } from "./useTransferQuote";
import { useAmountInput } from "./useAmountInput";
import { validateBridgeAmount } from "../utils";

export function useBridge() {
  const [shouldUpdateQuote, setShouldUpdateQuote] = useState(true);
  const [usedTransferQuote, setUsedTransferQuote] = useState<TransferQuote>();

  // default slippage of 0.5%
  const [swapSlippage, setSwapSlippage] = useState(0.5);

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

  const {
    data: transferQuote,
    isLoading: isQuoteLoading,
    isFetching: isQuoteFetching,
    isIdle: isQuoteIdle,
  } = useTransferQuote(
    selectedRoute,
    parsedAmount?.gt(0) ? parsedAmount : utils.bnZero,
    swapSlippage,
    account,
    toAccount?.address
  );

  const { quotedFees, quotedLimits, quotedSwap, estimatedTime } =
    usedTransferQuote || {};

  const isQuoteUpdating =
    shouldUpdateQuote &&
    (isQuoteLoading || isQuoteFetching || Boolean(parsedAmount && isQuoteIdle));

  const { error: amountValidationError } = validateBridgeAmount(
    parsedAmount,
    quotedFees?.isAmountTooLow,
    maxBalance,
    quotedLimits?.maxDeposit,
    selectedRoute.type === "swap"
      ? BigNumber.from(quotedSwap?.minExpectedInputTokenAmount || 0)
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
    handleSetNewSlippage: (newSlippage: number) => setSwapSlippage(newSlippage),
    isQuoteLoading: isQuoteLoading || Boolean(parsedAmount && isQuoteIdle),
  };
}
