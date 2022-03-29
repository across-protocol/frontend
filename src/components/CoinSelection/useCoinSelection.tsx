import { useSelect } from "downshift";
import { ethers } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import React, { useMemo, useEffect, useCallback } from "react";
import { useConnection } from "state/hooks";
import { useBalance, useBalances, useBridgeFees, useSendForm } from "hooks";
import {
  TOKENS_LIST,
  ParsingError,
  filterTokensByDestinationChain,
  max,
  InsufficientBalanceError,
  FEE_ESTIMATION,
  CHAINS,
} from "utils";

export default function useCoinSelection() {
  const { account, isConnected } = useConnection();
  const {
    setAmount,
    setToken,
    amount,
    token,
    toChain,
    fromChain,
    error: formError,
    setError: setFormError,
    status: formStatus,
  } = useSendForm();

  const tokenList = useMemo(
    () => filterTokensByDestinationChain(fromChain, toChain),
    [fromChain, toChain]
  );

  const { balances } = useBalances(
    TOKENS_LIST[fromChain].map((t) => t.address),
    fromChain,
    account
  );

  const { balance } = useBalance(token, fromChain, account);

  const { selectedItem, ...downshiftState } = useSelect({
    items: tokenList,
    defaultSelectedItem: tokenList.find((t) => t.address === token),
    selectedItem: tokenList.find((t) => t.address === token),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setInputAmount("");
        setToken(selectedItem.address);
      }
    },
  });
  const { fees } = useBridgeFees(amount, fromChain, selectedItem!.symbol);
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
        const amount = parseUnits(value, selectedItem!.decimals);
        setAmount(amount);
      } catch (e) {
        setFormError(new ParsingError());
      }
    },
    [selectedItem, setAmount, setFormError]
  );

  const handleMaxClick = useCallback(() => {
    if (balances && selectedItem) {
      const selectedIndex = tokenList.findIndex(
        ({ address }) => address === selectedItem.address
      );
      const isEth = tokenList[selectedIndex].symbol === "ETH";
      let adjustedBalance = balance;

      if (adjustedBalance) {
        if (isEth) {
          adjustedBalance = max(
            adjustedBalance.sub(ethers.utils.parseEther(FEE_ESTIMATION)),
            0
          );
        }
        setAmount(adjustedBalance);
        setInputAmount(formatUnits(adjustedBalance, selectedItem.decimals));
      } else {
        setAmount(ethers.constants.Zero);
        setInputAmount(
          formatUnits(ethers.constants.Zero, selectedItem.decimals)
        );
      }
    }
  }, [balance, balances, selectedItem, setAmount, tokenList]);
  // checks for insufficient balance errors
  let error: InsufficientBalanceError | ParsingError | undefined = formError;
  const isEth = token === CHAINS[fromChain].ETHAddress;
  if (
    balance &&
    amount.gt(
      isEth ? balance.sub(ethers.utils.parseEther(FEE_ESTIMATION)) : balance
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
    tokenList,
    error,
  };
}
