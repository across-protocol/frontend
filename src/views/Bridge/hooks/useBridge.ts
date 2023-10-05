import { BigNumber } from "ethers";
import { useCallback, useEffect, useState } from "react";

import { useConnection, useIsWrongNetwork, useAmplitude } from "hooks";
import useReferrer from "hooks/useReferrer";

import { useBridgeAction } from "./useBridgeAction";
import { useBridgeDepositTracking } from "./useBridgeDepositTracking";
import { useToAccount } from "./useToAccount";
import { useSelectRoute } from "./useSelectRoute";
import { useTransferQuote } from "./useTransferQuote";
import { useAmountInput, useValidAmount } from "./useAmountInput";
import { ampli } from "ampli";

export function useBridge() {
  const [shouldUpdateQuote, setShouldUpdateQuote] = useState(true);
  const [usedTransferQuote, setUsedTransferQuote] =
    useState<ReturnType<typeof useTransferQuote>["data"]>();

  const { isConnected, chainId: walletChainId, account } = useConnection();

  const { referrer } = useReferrer();

  const { addToAmpliQueue } = useAmplitude();

  const {
    selectedRoute,
    handleQuickSwap,
    handleSelectFromChain,
    handleSelectToChain,
    handleSelectToken,
  } = useSelectRoute();

  const {
    handleTxHashChange,
    trackingTxHash,
    transactionPending,
    explorerUrl,
    transactionElapsedTimeAsFormattedString,
    handleTransactionCompleted,
  } = useBridgeDepositTracking();

  const {
    handleChangeAmountInput,
    handleClickMaxBalance,
    clearInput,
    userAmountInput,
    parsedAmount,
    balance,
  } = useAmountInput(selectedRoute);

  const { toAccount, setCustomToAddress } = useToAccount(selectedRoute.toChain);

  const { data: transferQuote, isLoading: isQuoteLoading } = useTransferQuote(
    selectedRoute,
    parsedAmount?.gt(0) ? parsedAmount : BigNumber.from(0),
    account,
    toAccount?.address
  );

  const {
    quote,
    quotePriceUSD,
    quotedFees,
    quotedLimits,
    initialQuoteTime,
    estimatedTime,
  } = usedTransferQuote || {};

  const { amountValidationError, isAmountValid } = useValidAmount(
    parsedAmount,
    quotedFees?.isAmountTooLow,
    balance,
    quotedLimits?.maxDeposit
  );

  const {
    isWrongNetwork,
    isWrongNetworkHandlerWithoutError: isWrongNetworkHandler,
    checkWrongNetworkHandler,
  } = useIsWrongNetwork(selectedRoute.fromChain);

  const bridgeAction = useBridgeAction(
    isQuoteLoading,
    isAmountValid && parsedAmount && quotedFees && quotedLimits
      ? {
          amount: parsedAmount,
          fromChain: selectedRoute.fromChain,
          toChain: selectedRoute.toChain,
          timestamp: quotedFees.quoteTimestamp,
          referrer,
          relayerFeePct: quotedFees.relayerFee.pct,
          tokenAddress: selectedRoute.fromTokenAddress,
          isNative: selectedRoute.isNative,
          toAddress: toAccount?.address ?? "",
        }
      : undefined,
    selectedRoute.fromTokenSymbol,
    handleTxHashChange,
    handleTransactionCompleted,
    quote,
    initialQuoteTime,
    quotePriceUSD
  );

  useEffect(() => {
    checkWrongNetworkHandler();
  }, [selectedRoute.fromChain, isConnected, checkWrongNetworkHandler]);

  useEffect(() => {
    if (shouldUpdateQuote && !isQuoteLoading) {
      console.log("setUsedTransferQuote", transferQuote);
      setUsedTransferQuote(transferQuote);

      if (transferQuote?.quote) {
        addToAmpliQueue(() => {
          ampli.transferQuoteReceived(transferQuote?.quote);
        });
      }
    }
  }, [transferQuote, shouldUpdateQuote, isQuoteLoading, addToAmpliQueue]);

  useEffect(() => {
    if (
      shouldUpdateQuote &&
      (bridgeAction.isButtonActionLoading || trackingTxHash)
    ) {
      setShouldUpdateQuote(false);
    } else if (bridgeAction.didActionError && !shouldUpdateQuote) {
      setShouldUpdateQuote(true);
    }
  }, [
    shouldUpdateQuote,
    bridgeAction.isButtonActionLoading,
    trackingTxHash,
    bridgeAction.didActionError,
  ]);

  const handleClickNewTx = useCallback(() => {
    clearInput();
    setShouldUpdateQuote(true);
    handleTxHashChange(undefined);
  }, [clearInput, handleTxHashChange]);

  const estimatedTimeString =
    isQuoteLoading && !trackingTxHash
      ? "loading..."
      : estimatedTime?.formattedString;

  return {
    ...bridgeAction,
    setCustomToAddress,
    selectedRoute,
    toAccount,
    walletAccount: account,
    fees: quotedFees,
    balance,
    handleQuickSwap,
    isWrongChain: isWrongNetwork,
    handleChainSwitch: isWrongNetworkHandler,
    walletChainId,
    isConnected,
    isBridgeDisabled: isConnected && bridgeAction.buttonDisabled,
    amountToBridge: parsedAmount,
    estimatedTimeString,
    trackingTxHash,
    transactionPending,
    explorerUrl,
    handleClickNewTx,
    transactionElapsedTimeAsFormattedString,
    handleChangeAmountInput,
    handleClickMaxBalance,
    userAmountInput,
    amountValidationError,
    handleSelectFromChain,
    handleSelectToChain,
    handleSelectToken,
  };
}
