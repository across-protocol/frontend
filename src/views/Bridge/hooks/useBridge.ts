import { useCallback, useEffect, useMemo, useState } from "react";
import { utils } from "@across-protocol/sdk-v2";

import { useConnection, useIsWrongNetwork, useAmplitude } from "hooks";
import useReferrer from "hooks/useReferrer";
import { useStakingPool } from "hooks/useStakingPool";
import { ampli } from "ampli";

import { useBridgeAction } from "./useBridgeAction";
import { useBridgeDepositTracking } from "./useBridgeDepositTracking";
import { useToAccount } from "./useToAccount";
import { useSelectRoute } from "./useSelectRoute";
import { useTransferQuote } from "./useTransferQuote";
import { useAmountInput, useValidAmount } from "./useAmountInput";
import { useCoingeckoPrice } from "hooks/useCoingeckoPrice";
import { fixedPointAdjustment, getToken, parseUnits } from "utils";
import { BigNumber } from "ethers";
import { useReferralSummary } from "hooks/useReferralSummary";

export type ConvertTokensToBaseCurrencyType = {
  l1: (amount?: BigNumber) => BigNumber | undefined;
  acx: (amount?: BigNumber) => BigNumber | undefined;
};

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

  const { convertTokenToBaseCurrency: convertL1ToBaseCurrency } =
    useCoingeckoPrice(selectedRoute.l1TokenAddress, "usd");

  const { convertTokenToBaseCurrency: convertACXToBaseCurrency } =
    useCoingeckoPrice(getToken("ACX").mainnetAddress!, "usd");

  const convertTokensToBaseCurrency: ConvertTokensToBaseCurrencyType = {
    l1: convertL1ToBaseCurrency,
    acx: convertACXToBaseCurrency,
  };

  const { summary: referralSummary } = useReferralSummary(account);

  const { data: selectedRoutePool, isLoading: isSelectedRoutePoolLoading } =
    useStakingPool(selectedRoute.l1TokenAddress);

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

  const { data: transferQuote, isLoading: isQuoteLoading } = useTransferQuote(
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

  const depositReferralReward = useMemo(() => {
    const fees = usedTransferQuote?.quotedFees;

    if (!utils.isDefined(referralSummary) || !utils.isDefined(fees)) {
      return undefined;
    }
    // Find total fees in terms of the token being bridged
    const totalFees = fees.lpFee.total.add(fees.relayerFee.total);
    // Convert the fees to usd using the token price
    const totalFeesUSD = convertL1ToBaseCurrency(totalFees);
    // Find the exchange rate for 1.0 token of ACX
    const acxExchangeRate = convertACXToBaseCurrency(parseUnits("1", 18));
    // Verify that the two usd values are defined
    if (!utils.isDefined(totalFeesUSD) || !utils.isDefined(acxExchangeRate)) {
      return undefined;
    }
    // Resolve total fees in terms of ACX
    const totalFeesACX = totalFeesUSD
      .mul(fixedPointAdjustment)
      .div(acxExchangeRate);
    // We can treat this as a percentage with 18 decimals
    const feePct = parseUnits(referralSummary.referralRate.toString(), 18);
    // Find the total referral reward as a percentage of the total fees
    const referralReward = totalFeesACX.mul(feePct).div(fixedPointAdjustment);
    // Return the referral reward in terms of ACX
    return referralReward;
  }, [
    convertACXToBaseCurrency,
    convertL1ToBaseCurrency,
    referralSummary,
    usedTransferQuote?.quotedFees,
  ]);

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
    if (shouldUpdateQuote && !isQuoteLoading) {
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
    isCurrentTokenMaxApyLoading: isSelectedRoutePoolLoading,
    currentTokenMaxApy: selectedRoutePool?.apyData.maxApy,
    convertTokensToBaseCurrency,
    depositReferralReward,
  };
}
