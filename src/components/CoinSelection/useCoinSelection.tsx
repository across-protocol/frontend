import React, { useEffect, useCallback } from "react";
import { useSelect } from "downshift";
import { ethers, BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { useConnection } from "state/hooks";
import { useBalancesBySymbols, useBridgeFees, useSendForm } from "hooks";
import {
  ParsingError,
  max,
  InsufficientBalanceError,
  trackEvent,
  FEE_ESTIMATION,
  toWeiSafe,
  getConfig,
  bridgeDisabled,
} from "utils";

import { useQueryParams } from "hooks";

export default function useCoinSelection() {
  const { account, isConnected } = useConnection();
  const params = useQueryParams();
  const {
    setAmount,
    setTokenSymbol,
    amount,
    tokenSymbol,
    toChain,
    fromChain,
    error: formError,
    setError: setFormError,
    availableTokens,
  } = useSendForm();

  const { balances = [] } = useBalancesBySymbols({
    tokenSymbols: availableTokens.map((t) => t.symbol),
    chainId: fromChain,
    account,
  });

  const { selectedItem, ...downshiftState } = useSelect({
    items: availableTokens,
    defaultSelectedItem: availableTokens[0],
    selectedItem: availableTokens.find((t) => t.symbol === tokenSymbol),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setTokenSymbol(selectedItem.symbol);
        // Matomo track token selection
        trackEvent({
          category: "send",
          action: "setAsset",
          name: selectedItem.symbol,
        });
      }
    },
  });
  const selectedIndex = availableTokens.findIndex(
    (token) => token.symbol === selectedItem?.symbol
  );
  const balance = balances[selectedIndex];
  const { fees } = useBridgeFees(
    amount,
    fromChain,
    toChain,
    selectedItem?.symbol
  );

  const [inputAmount, setInputAmount] = React.useState<string>(
    selectedItem && amount.gt("0")
      ? formatUnits(amount, selectedItem.decimals)
      : ""
  );

  // Change the input if amount and asset exists.
  // We do a check to see if the amount is valid by calling toWeiSafe.
  const config = getConfig();

  useEffect(() => {
    if (params.amount && params.asset && params.from) {
      try {
        // Check if Token exists and amount is convertable to Wei
        config.getTokenInfoBySymbol(
          Number(params.from),
          params.asset.toUpperCase()
        );
        toWeiSafe(params.amount);

        setInputAmount(params.amount);
      } catch (err) {
        console.error("err", err);
      }
    }
  }, [params.amount, params.asset, params.to, params.from, config]);

  useEffect(() => {
    if (!selectedItem || inputAmount === "" || inputAmount === "0") {
      setAmount(ethers.constants.Zero);
    } else {
      try {
        const amount = parseUnits(inputAmount, selectedItem.decimals);
        setAmount(amount);
      } catch (e) {
        // if we have a parsing error, we have to set this to 0 otherwise we might get fee calculation issues
        setAmount(BigNumber.from(0));
        // this can throw an error if parseUnits fails for an input amount that has more decimals than token decimals
        setFormError(new ParsingError());
      }
    }
  }, [inputAmount, selectedItem, setAmount, setFormError, tokenSymbol]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputAmount(value);
    },
    [setInputAmount]
  );

  const handleMaxClick = useCallback(() => {
    if (!balance || !selectedItem) {
      setInputAmount(formatUnits(ethers.constants.Zero));
      return;
    }
    let adjustedBalance = balance;
    // adjust balance if this is a native token, accounting for gas fees
    if (selectedItem.isNative) {
      adjustedBalance = max(
        adjustedBalance.sub(ethers.utils.parseEther(FEE_ESTIMATION)),
        0
      );
    }
    setInputAmount(formatUnits(adjustedBalance, selectedItem.decimals));
  }, [balance, selectedItem]);
  // checks for insufficient balance errors
  let error: InsufficientBalanceError | ParsingError | undefined = formError;
  if (
    selectedItem &&
    balance &&
    amount.gt(
      selectedItem.isNative
        ? balance.sub(ethers.utils.parseEther(FEE_ESTIMATION))
        : balance
    )
  ) {
    error = new InsufficientBalanceError();
  }
  const errorMsg = bridgeDisabled
    ? "Bridge currently disabled"
    : error
    ? error.message
    : fees?.isAmountTooLow
    ? "Bridge fee is high for this amount. Send a larger amount."
    : fees?.isLiquidityInsufficient
    ? `Insufficient liquidity for ${selectedItem?.symbol}.`
    : undefined;

  const showError =
    bridgeDisabled ||
    error ||
    (fees?.isAmountTooLow && amount.gt(0)) ||
    (fees?.isLiquidityInsufficient && amount.gt(0));

  return {
    isConnected,
    ...downshiftState,
    balances,
    balance,
    errorMsg,
    showError,
    handleInputChange,
    handleMaxClick,
    inputAmount,
    setInputAmount,
    selectedItem,
    availableTokens,
    error,
    fromChain,
    account,
  };
}
