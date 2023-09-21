import { BigNumber } from "ethers";
import { useCallback, useEffect, useState } from "react";

import { useConnection, useIsWrongNetwork } from "hooks";
import useReferrer from "hooks/useReferrer";

import { useBridgeAction } from "./useBridgeAction";
import { useBridgeDepositTracking } from "./useBridgeDepositTracking";
import { useToAccount } from "./useToAccount";
import { useSelectRoute } from "./useSelectRoute";
import { useTransferQuote } from "./useTransferQuote";
import { useAmountInput, useValidAmount } from "./useAmountInput";

export function useBridge() {
  const [shouldUpdateQuote, setShouldUpdateQuote] = useState(true);

  const { isConnected, chainId: walletChainId, account } = useConnection();

  const { referrer } = useReferrer();

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
    maxBalance,
  } = useAmountInput(selectedRoute);

  const { toAccount, setCustomToAddress } = useToAccount(selectedRoute.toChain);

  const {
    estimatedTime,
    quote,
    initialQuoteTime,
    quotedFees,
    quotedLimits,
    quotePriceUSD,
    isQuoteLoading,
  } = useTransferQuote(
    selectedRoute,
    parsedAmount?.gt(0) ? parsedAmount : BigNumber.from(0),
    account,
    toAccount?.address,
    shouldUpdateQuote
  );

  const { amountValidationError, isAmountValid } = useValidAmount(
    parsedAmount,
    quotedFees?.isAmountTooLow,
    maxBalance,
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
    if (bridgeAction.isButtonActionLoading || trackingTxHash) {
      setShouldUpdateQuote(false);
    }
  }, [bridgeAction.isButtonActionLoading, trackingTxHash]);

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
