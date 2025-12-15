import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatAmountForDisplay,
  formatUSD,
  isValidNumberInput,
  parseInputValue,
} from "utils";
import { UnitType } from "../components/TokenInput/OriginTokenInput";
import { QuoteRequest } from "./useQuoteRequest/quoteRequestAction";
import { EnrichedToken } from "../components/ChainTokenSelector/ChainTokenSelectorModal";

interface UseTokenAmountInputParams {
  token: EnrichedToken | null;
  fieldName: "origin" | "destination";
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
  isUpdateLoading: boolean;
  setUserInput: (
    field: "origin" | "destination",
    amount: BigNumber | null
  ) => void;
  quoteRequest: QuoteRequest;
}

interface UseTokenAmountInputReturn {
  displayValue: string;
  convertedAmount: BigNumber | undefined;
  formattedConvertedAmount: string;
  inputDisabled: boolean;
  handleInputChange: (value: string) => void;
  handleBalanceClick: (amount: BigNumber) => void;
  toggleUnit: () => void;
  isUserInput: boolean;
}

export const useTokenAmountInput = ({
  token,
  fieldName,
  unit,
  setUnit,
  isUpdateLoading,
  setUserInput,
  quoteRequest,
}: UseTokenAmountInputParams): UseTokenAmountInputReturn => {
  const isUserInput = quoteRequest.userInputField === fieldName;

  const handleSetInputValue = useCallback(
    (value: string) => {
      if (!token) {
        setUserInput(fieldName, null);
        return;
      }

      try {
        const parsed = parseInputValue(value, token, unit);
        setUserInput(fieldName, parsed);
      } catch (e) {
        setUserInput(fieldName, null);
      }
    },
    [setUserInput, token, unit, fieldName]
  );

  const handleBalanceClick = useCallback(
    (amount: BigNumber) => {
      if (!token) return;
      setUserInput(fieldName, amount);
    },
    [token, setUserInput, fieldName]
  );

  const displayValue = useMemo(() => {
    if (!isUserInput && isUpdateLoading) {
      return "";
    }

    const amount = isUserInput
      ? quoteRequest.userInputAmount
      : quoteRequest.quoteOutputAmount;

    if (!amount || !token) {
      return "";
    }

    return formatAmountForDisplay(amount, token, unit);
  }, [
    isUserInput,
    isUpdateLoading,
    quoteRequest.userInputAmount,
    quoteRequest.quoteOutputAmount,
    token,
    unit,
  ]);

  const [convertedAmount, setConvertedAmount] = useState<BigNumber>();

  useEffect(() => {
    const amount = isUserInput
      ? quoteRequest.userInputAmount
      : quoteRequest.quoteOutputAmount;

    if (!token || !amount) {
      setConvertedAmount(undefined);
      return;
    }

    try {
      const formatted = formatAmountForDisplay(amount, token, unit);
      if (unit === "token") {
        const usdValue = convertTokenToUSD(formatted, token);
        setConvertedAmount(usdValue);
      } else {
        const tokenValue = convertUSDToToken(formatted, token);
        setConvertedAmount(tokenValue);
      }
    } catch (e) {
      setConvertedAmount(undefined);
    }
  }, [
    token,
    quoteRequest.userInputAmount,
    quoteRequest.quoteOutputAmount,
    unit,
    isUserInput,
  ]);

  const toggleUnit = useCallback(() => {
    if (!token || !convertedAmount) {
      setUnit(unit === "token" ? "usd" : "token");
      return;
    }

    const newUnit = unit === "token" ? "usd" : "token";
    setUnit(newUnit);

    if (isUserInput && quoteRequest.userInputAmount) {
      setUserInput(fieldName, convertedAmount);
    }
  }, [
    unit,
    token,
    convertedAmount,
    isUserInput,
    quoteRequest.userInputAmount,
    setUnit,
    setUserInput,
    fieldName,
  ]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!isValidNumberInput(value)) {
        return;
      }
      handleSetInputValue(value);
    },
    [handleSetInputValue]
  );

  const inputDisabled = (() => {
    if (!quoteRequest.destinationToken) return true;
    return Boolean(!isUserInput && isUpdateLoading);
  })();

  const formattedConvertedAmount = useMemo(() => {
    if (unit === "token") {
      if (!convertedAmount) return "$0.00";
      return "$" + formatUSD(convertedAmount);
    }
    if (!convertedAmount) return "0.00";
    return `${formatUnits(convertedAmount, token?.decimals)} ${token?.symbol}`;
  }, [unit, convertedAmount, token]);

  return {
    displayValue,
    convertedAmount,
    formattedConvertedAmount,
    inputDisabled,
    handleInputChange,
    handleBalanceClick,
    toggleUnit,
    isUserInput,
  };
};
