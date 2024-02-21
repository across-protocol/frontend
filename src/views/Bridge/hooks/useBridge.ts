import { useEffect, useState } from "react";
import { utils } from "@across-protocol/sdk-v2";

import { useConnection, useIsWrongNetwork, useAmplitude } from "hooks";
import useReferrer from "hooks/useReferrer";
import { ampli } from "ampli";

import { useBridgeAction } from "./useBridgeAction";
import { useToAccount } from "./useToAccount";
import { useSelectRoute } from "./useSelectRoute";
import { useTransferQuote } from "./useTransferQuote";
import { useAmountInput, useValidAmount } from "./useAmountInput";

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
  } = useTransferQuote(
    selectedRoute,
    parsedAmount?.gt(0) ? parsedAmount : utils.bnZero,
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

  const isQuoteUpdating =
    shouldUpdateQuote && (isQuoteLoading || isQuoteFetching);

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
    isQuoteUpdating,
    isAmountValid && parsedAmount && quotedFees && quotedLimits
      ? {
          amount: parsedAmount,
          fromChain: selectedRoute.fromChain,
          toChain: selectedRoute.toChain,
          timestamp: quotedFees.quoteTimestamp,
          referrer,
          relayerFeePct: quotedFees.totalRelayFee.pct,
          tokenAddress: selectedRoute.fromTokenAddress,
          isNative: selectedRoute.isNative,
          toAddress: toAccount?.address ?? "",
        }
      : undefined,
    selectedRoute.fromTokenSymbol,
    quote,
    initialQuoteTime,
    quotePriceUSD
  );

  useEffect(() => {
    checkWrongNetworkHandler();
  }, [selectedRoute.fromChain, isConnected, checkWrongNetworkHandler]);

  useEffect(() => {
    if (!isQuoteUpdating && shouldUpdateQuote) {
      setUsedTransferQuote(transferQuote);

      if (transferQuote?.quote) {
        addToAmpliQueue(() => {
          ampli.transferQuoteReceived(transferQuote?.quote);
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

  const estimatedTimeString = isQuoteLoading
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
    handleChangeAmountInput,
    handleClickMaxBalance,
    userAmountInput,
    amountValidationError,
    handleSelectFromChain,
    handleSelectToChain,
    handleSelectToken,
  };
}
