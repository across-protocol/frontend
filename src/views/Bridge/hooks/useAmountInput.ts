import { useState, useEffect, useCallback } from "react";
import { BigNumber, utils } from "ethers";

import { useAmplitude, useBalanceBySymbol, usePrevious } from "hooks";
import { getConfig, Route, trackMaxButtonClicked } from "utils";

import {
  AmountInputError,
  validateBridgeAmount,
  areTokensInterchangeable,
} from "../utils";
import { useMaxBalance } from "./useMaxBalance";

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

  const { data: maxBalance } = useMaxBalance(selectedRoute);

  const token = getConfig().getTokenInfoBySymbol(
    selectedRoute.fromChain,
    selectedRoute.fromTokenSymbol
  );

  const handleClickMaxBalance = useCallback(() => {
    console.log("handleClickMaxBalance", maxBalance?.toNumber());
    if (maxBalance) {
      setUserAmountInput(utils.formatUnits(maxBalance, token.decimals));
      addToAmpliQueue(() => {
        trackMaxButtonClicked("bridgeForm");
      });
    }
  }, [maxBalance, token.decimals, addToAmpliQueue]);

  const handleChangeAmountInput = useCallback((changedInput: string) => {
    console.log("handleChangeAmountInput", changedInput);
    setUserAmountInput(changedInput);
  }, []);

  const clearInput = useCallback(() => {
    console.log("clearInput");
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
    if (userAmountInput) {
      try {
        const parsed = utils.parseUnits(userAmountInput, token.decimals);
        setParsedAmount(parsed);
      } catch (error) {
        setParsedAmount(undefined);
      }
    }
  }, [userAmountInput, token.decimals]);

  return {
    handleChangeAmountInput,
    handleClickMaxBalance,
    clearInput,
    userAmountInput,
    parsedAmount,
    balance,
    maxBalance,
  };
}

export function useValidAmount(
  parsedAmount?: BigNumber,
  isAmountTooLow?: boolean,
  maxBalance?: BigNumber,
  maxDeposit?: BigNumber
) {
  const [validationError, setValidationError] = useState<
    AmountInputError | undefined
  >();

  useEffect(() => {
    const { error } = validateBridgeAmount(
      parsedAmount,
      isAmountTooLow,
      maxBalance,
      maxDeposit
    );
    setValidationError(error);
  }, [parsedAmount, isAmountTooLow, maxBalance, maxDeposit]);

  return {
    amountValidationError: validationError,
    isAmountValid: !Boolean(validationError),
  };
}
