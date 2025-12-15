import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber, utils } from "ethers";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatAmountForDisplay,
  isValidNumberInput,
  parseInputValue,
} from "utils";
import { EnrichedToken } from "views/SwapAndBridge/components/ChainTokenSelector/ChainTokenSelectorModal";

export type UnitType = "usd" | "token";

type UseTokenInputProps = {
  token: EnrichedToken | null;
  inputValue: string;
  setInputValue: (value: string, amount: BigNumber | null) => void;
  isUserInput: boolean;
  quoteOutputAmount: BigNumber | null | undefined;
  isUpdateLoading: boolean;
  unit?: UnitType;
  setUnit?: (unit: UnitType) => void;
};

type UseTokenInputReturn = {
  amountString: string;
  unit: UnitType;
  convertedAmount: BigNumber | undefined;
  toggleUnit: () => void;
  handleInputChange: (value: string) => void;
  handleBalanceClick: (amount: BigNumber, decimals: number) => void;
};

export function useTokenInput({
  token,
  inputValue,
  setInputValue,
  isUserInput,
  quoteOutputAmount,
  isUpdateLoading,
  unit: externalUnit,
  setUnit: externalSetUnit,
}: UseTokenInputProps): UseTokenInputReturn {
  const [internalUnit, setInternalUnit] = useState<UnitType>("token");
  const [convertedAmount, setConvertedAmount] = useState<BigNumber>();

  const unit = externalUnit ?? internalUnit;
  const setUnit = externalSetUnit ?? setInternalUnit;

  const displayValue = useMemo(() => {
    if (!isUserInput && isUpdateLoading) {
      return "";
    }
    if (!isUserInput && quoteOutputAmount && token) {
      return formatAmountForDisplay(quoteOutputAmount, token, unit);
    }
    return inputValue;
  }, [
    isUserInput,
    isUpdateLoading,
    quoteOutputAmount,
    token,
    unit,
    inputValue,
  ]);

  useEffect(() => {
    if (!token || !displayValue) {
      setConvertedAmount(undefined);
      return;
    }
    try {
      if (unit === "token") {
        const usdValue = convertTokenToUSD(displayValue, token);
        setConvertedAmount(usdValue);
      } else {
        const tokenValue = convertUSDToToken(displayValue, token);
        setConvertedAmount(tokenValue);
      }
    } catch (e) {
      setConvertedAmount(undefined);
    }
  }, [token, displayValue, unit]);

  const toggleUnit = useCallback(() => {
    if (unit === "token") {
      if (inputValue && token && convertedAmount) {
        try {
          const a = utils.formatUnits(convertedAmount, 18);
          const parsed = parseInputValue(a, token, "usd");
          setInputValue(a, parsed);
        } catch (e) {
          setInputValue("0", null);
        }
      }
      setUnit("usd");
    } else {
      if (inputValue && token && convertedAmount) {
        try {
          const a = utils.formatUnits(convertedAmount, token.decimals);
          const parsed = parseInputValue(a, token, "token");
          setInputValue(a, parsed);
        } catch (e) {
          setInputValue("0", null);
        }
      }
      setUnit("token");
    }
  }, [unit, inputValue, token, convertedAmount, setUnit, setInputValue]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!isValidNumberInput(value)) {
        return;
      }

      if (!token) {
        setInputValue(value, null);
        return;
      }

      try {
        const parsed = parseInputValue(value, token, unit);
        setInputValue(value, parsed);
      } catch (e) {
        setInputValue(value, null);
      }
    },
    [token, unit, setInputValue]
  );

  const handleBalanceClick = useCallback(
    (amount: BigNumber, _decimals: number) => {
      if (token) {
        setInputValue(formatAmountForDisplay(amount, token, unit), amount);
      }
    },
    [unit, token, setInputValue]
  );

  return {
    amountString: displayValue,
    unit,
    convertedAmount,
    toggleUnit,
    handleInputChange,
    handleBalanceClick,
  };
}
