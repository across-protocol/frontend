import { useState, useEffect, useCallback } from "react";
import { BigNumber, utils } from "ethers";

import { useAmplitude, useBalanceBySymbol, usePrevious } from "hooks";
import { getConfig, Route, trackMaxButtonClicked } from "utils";

import {
  AmountInputError,
  validateBridgeAmount,
  areTokensInterchangeable,
} from "../utils";

export function useAmountInput(selectedRoute: Route) {
  const [userAmountInput, setUserAmountInput] = useState("");
  const [parsedAmount, setParsedAmount] = useState<BigNumber | undefined>(
    undefined
  );

  const prevFromTokenSymbol = usePrevious(selectedRoute.fromTokenSymbol);

  const { addToAmpliQueue } = useAmplitude();

  const { balance } = useBalanceBySymbol(
    selectedRoute.fromTokenSymbol,
    selectedRoute.fromChain
  );

  const token = getConfig().getTokenInfoBySymbol(
    selectedRoute.fromChain,
    selectedRoute.fromTokenSymbol
  );

  const handleClickMaxBalance = useCallback(() => {
    if (balance) {
      setUserAmountInput(utils.formatUnits(balance, token.decimals));
      addToAmpliQueue(() => {
        trackMaxButtonClicked("bridgeForm");
      });
    }
  }, [balance, token.decimals, addToAmpliQueue]);

  const handleChangeAmountInput = useCallback((changedInput: string) => {
    setUserAmountInput(changedInput);
  }, []);

  const clearInput = useCallback(() => {
    setUserAmountInput("");
    setParsedAmount(undefined);
  }, []);

  useEffect(() => {
    if (
      prevFromTokenSymbol === selectedRoute.fromTokenSymbol ||
      areTokensInterchangeable(
        prevFromTokenSymbol,
        selectedRoute.fromTokenSymbol
      )
    ) {
      return;
    }

    clearInput();
  }, [prevFromTokenSymbol, selectedRoute.fromTokenSymbol, clearInput]);

  useEffect(() => {
    try {
      const parsed = utils.parseUnits(userAmountInput, token.decimals);
      setParsedAmount(parsed);
    } catch (error) {
      setParsedAmount(undefined);
    }
  }, [userAmountInput, token.decimals]);

  return {
    handleChangeAmountInput,
    handleClickMaxBalance,
    clearInput,
    userAmountInput,
    parsedAmount,
    balance,
  };
}

export function useValidAmount(
  parsedAmount?: BigNumber,
  isAmountTooLow?: boolean,
  currentBalance?: BigNumber,
  maxDeposit?: BigNumber
) {
  const [validationError, setValidationError] = useState<
    AmountInputError | undefined
  >();

  useEffect(() => {
    const { error } = validateBridgeAmount(
      parsedAmount,
      isAmountTooLow,
      currentBalance,
      maxDeposit
    );
    setValidationError(error);
  }, [parsedAmount, isAmountTooLow, currentBalance, maxDeposit]);

  return {
    amountValidationError: validationError,
    isAmountValid: !Boolean(validationError),
  };
}
