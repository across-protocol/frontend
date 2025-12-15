import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber, utils } from "ethers";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatAmountForDisplay,
  isValidNumberInput,
} from "utils";
import { EnrichedToken } from "views/SwapAndBridge/components/ChainTokenSelector/ChainTokenSelectorModal";

export type UnitType = "usd" | "token";

type UseTokenInputProps = {
  token: EnrichedToken | null;
  inputValue: string;
  setInputValue: (value: string) => void;
  isUserInput: boolean;
  quoteOutputAmount: BigNumber | null | undefined;
  isUpdateLoading: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
};

type UseTokenInputReturn = {
  amountString: string;
  convertedAmount: BigNumber | undefined;
  toggleUnit: () => void;
  handleInputChange: (value: string) => void;
};

export function useTokenInput({
  token,
  inputValue,
  setInputValue,
  isUserInput,
  quoteOutputAmount,
  isUpdateLoading,
  unit,
  setUnit,
}: UseTokenInputProps): UseTokenInputReturn {
  const [convertedAmount, setConvertedAmount] = useState<BigNumber>();

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
          setInputValue(a);
        } catch (e) {
          setInputValue("0");
        }
      }
      setUnit("usd");
    } else {
      if (inputValue && token && convertedAmount) {
        try {
          const a = utils.formatUnits(convertedAmount, token.decimals);
          setInputValue(a);
        } catch (e) {
          setInputValue("0");
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

      setInputValue(value);
    },
    [setInputValue]
  );

  return {
    amountString: displayValue,
    convertedAmount,
    toggleUnit,
    handleInputChange,
  };
}
