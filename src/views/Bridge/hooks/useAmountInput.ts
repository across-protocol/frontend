import { useState, useEffect, useCallback } from "react";
import { BigNumber, utils } from "ethers";

import { useAmplitude, useBalanceBySymbol, usePrevious } from "hooks";
import { getConfig, Route, trackMaxButtonClicked } from "utils";

import { areTokensInterchangeable } from "../utils";
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

  const _handleParsedAmount = useCallback((input: string, decimals: number) => {
    try {
      const parsed = utils.parseUnits(input, decimals);
      setParsedAmount(parsed);
    } catch (error) {
      setParsedAmount(undefined);
    }
  }, []);

  const handleClickMaxBalance = useCallback(() => {
    if (maxBalance) {
      const amountInput = utils.formatUnits(maxBalance, token.decimals);
      setUserAmountInput(amountInput);
      _handleParsedAmount(amountInput, token.decimals);
      addToAmpliQueue(() => {
        trackMaxButtonClicked("bridgeForm");
      });
    }
  }, [maxBalance, token.decimals, addToAmpliQueue, _handleParsedAmount]);

  const handleChangeAmountInput = useCallback(
    (changedInput: string) => {
      setUserAmountInput(changedInput);
      _handleParsedAmount(changedInput, token.decimals);
    },
    [token.decimals, _handleParsedAmount]
  );

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
