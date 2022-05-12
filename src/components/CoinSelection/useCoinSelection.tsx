import { useSelect } from "downshift";
import { ethers } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import React, { useEffect, useCallback } from "react";
import { useConnection } from "state/hooks";
import { useBalancesBySymbols, useBridgeFees, useSendForm } from "hooks";
import {
  ParsingError,
  max,
  InsufficientBalanceError,
  trackEvent,
  FEE_ESTIMATION,
} from "utils";

export default function useCoinSelection() {
  const { account, isConnected } = useConnection();
  const {
    setAmount,
    setTokenSymbol,
    amount,
    tokenSymbol,
    toChain,
    fromChain,
    error: formError,
    setError: setFormError,
    status: formStatus,
    availableTokens,
  } = useSendForm();

  const { balances = [] } = useBalancesBySymbols(
    availableTokens.map((t) => t.symbol),
    fromChain,
    account
  );
  const { selectedItem, ...downshiftState } = useSelect({
    items: availableTokens,
    defaultSelectedItem: availableTokens[0],
    selectedItem: availableTokens.find((t) => t.symbol === tokenSymbol),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setInputAmount("");
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
  const { fees } = useBridgeFees(amount, toChain, selectedItem?.symbol);
  const [inputAmount, setInputAmount] = React.useState<string>(
    selectedItem && amount.gt("0")
      ? formatUnits(amount, selectedItem.decimals)
      : ""
  );

  useEffect(() => {
    if (formStatus === "idle") {
      setInputAmount("");
    }
  }, [formStatus]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputAmount(value);
      if (value === "") {
        setAmount(ethers.constants.Zero);
        return;
      }
      try {
        const amount = parseUnits(value, selectedItem?.decimals);
        setAmount(amount);
      } catch (e) {
        setFormError(new ParsingError());
      }
    },
    [selectedItem, setAmount, setFormError]
  );

  const handleMaxClick = useCallback(() => {
    if (!balance || !selectedItem) {
      setAmount(ethers.constants.Zero);
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
    setAmount(adjustedBalance);
    setInputAmount(formatUnits(adjustedBalance, selectedItem.decimals));
  }, [balance, selectedItem, setAmount]);
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
  const errorMsg = error
    ? error.message
    : fees?.isAmountTooLow
    ? "Bridge fee is high for this amount. Send a larger amount."
    : fees?.isLiquidityInsufficient
    ? `Insufficient liquidity for ${selectedItem?.symbol}.`
    : undefined;

  const showError =
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
  };
}
