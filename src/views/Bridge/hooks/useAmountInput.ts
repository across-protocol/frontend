import { useState, useEffect, useCallback } from "react";
import { BigNumber, utils } from "ethers";
import { debounce } from "lodash-es";

import { useAmplitude, useBalanceBySymbol, usePrevious } from "hooks";
import { getConfig, trackMaxButtonClicked } from "utils";

import { SelectedRoute, areTokensInterchangeable } from "../utils";
import { useMaxBalance } from "./useMaxBalance";

export function useAmountInput(selectedRoute: SelectedRoute) {
  const [userAmountInput, setUserAmountInput] = useState("");
  const [parsedAmount, setParsedAmount] = useState<BigNumber | undefined>(
    undefined
  );

  const prevFromTokenSymbol = usePrevious(selectedRoute.fromTokenSymbol);

  const { addToAmpliQueue } = useAmplitude();

  const amountTokenSymbol =
    selectedRoute.type === "swap"
      ? selectedRoute.swapTokenSymbol
      : selectedRoute.fromTokenSymbol;

  const { balance } = useBalanceBySymbol(
    amountTokenSymbol,
    selectedRoute.fromChain
  );

  const { data: maxBalance } = useMaxBalance(selectedRoute);

  const token = getConfig().getTokenInfoBySymbol(
    selectedRoute.fromChain,
    amountTokenSymbol
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _handleParsedAmount = useCallback(
    debounce(
      (input: string, decimals: number) => {
        try {
          const parsed = utils.parseUnits(input, decimals);
          setParsedAmount(parsed);
        } catch (error) {
          setParsedAmount(undefined);
        }
      },
      500,
      {
        leading: true,
      }
    ),
    []
  );

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
      prevFromTokenSymbol === amountTokenSymbol ||
      areTokensInterchangeable(prevFromTokenSymbol, amountTokenSymbol)
    ) {
      return;
    }

    clearInput();
  }, [prevFromTokenSymbol, amountTokenSymbol, clearInput]);

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
