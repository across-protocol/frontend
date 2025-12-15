import { useCallback, useEffect, useMemo, useState } from "react";
import { BigNumber, utils } from "ethers";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatAmountForDisplay,
  parseInputValue,
  isValidNumberInput,
} from "utils";
import { EnrichedToken } from "views/SwapAndBridge/components/ChainTokenSelector/ChainTokenSelectorModal";

export type UnitType = "usd" | "token";

type UseTokenInputProps = {
  token: EnrichedToken | null;
  setAmount: (amount: BigNumber | null) => void;
  expectedAmount: BigNumber | undefined;
  shouldUpdate: boolean;
  isUpdateLoading: boolean;
  // Optional: Allow unit state to be controlled from parent
  unit?: UnitType;
  setUnit?: (unit: UnitType) => void;
};

type UseTokenInputReturn = {
  amountString: string;
  setAmountString: (value: string) => void;
  unit: UnitType;
  convertedAmount: BigNumber | undefined;
  toggleUnit: () => void;
  handleInputChange: (value: string) => void;
  handleBalanceClick: (amount: BigNumber, decimals: number) => void;
};

export function useTokenInput({
  token,
  setAmount,
  expectedAmount,
  shouldUpdate,
  isUpdateLoading,
  unit: externalUnit,
  setUnit: externalSetUnit,
}: UseTokenInputProps): UseTokenInputReturn {
  const [amountString, setAmountString] = useState<string>("");
  const [localInputValue, setLocalInputValue] = useState<string>("");
  const [internalUnit, setInternalUnit] = useState<UnitType>("token");
  const [convertedAmount, setConvertedAmount] = useState<BigNumber>();
  const [justTyped, setJustTyped] = useState(false);

  const unit = externalUnit ?? internalUnit;
  const setUnit = externalSetUnit ?? setInternalUnit;

  const displayValue = useMemo(() => {
    if (shouldUpdate && isUpdateLoading) {
      return "";
    }
    if (shouldUpdate && expectedAmount && token) {
      return formatAmountForDisplay(expectedAmount, token, unit);
    }
    return localInputValue;
  }, [
    shouldUpdate,
    isUpdateLoading,
    expectedAmount,
    token,
    unit,
    localInputValue,
  ]);

  useEffect(() => {
    setAmountString(displayValue);
  }, [displayValue]);

  useEffect(() => {
    if (!justTyped) {
      return;
    }
    setJustTyped(false);
    try {
      if (!token) {
        setAmount(null);
        return;
      }
      const parsed = parseInputValue(localInputValue, token, unit);
      setAmount(parsed);
    } catch (e) {
      setAmount(null);
    }
  }, [localInputValue, justTyped, token, unit, setAmount]);

  useEffect(() => {
    if (token) {
      setLocalInputValue("");
      setConvertedAmount(undefined);
      setAmount(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.chainId, token?.symbol]);

  useEffect(() => {
    if (shouldUpdate && isUpdateLoading) {
      setAmountString("");
    }

    if (shouldUpdate && token) {
      if (!expectedAmount && !isUpdateLoading) {
        setAmountString("");
      } else {
        if (expectedAmount) {
          setAmountString(formatAmountForDisplay(expectedAmount, token, unit));
        }
      }
    }
  }, [expectedAmount, isUpdateLoading, shouldUpdate, token, unit]);

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
      if (localInputValue && token && convertedAmount) {
        try {
          const a = utils.formatUnits(convertedAmount, 18);
          setLocalInputValue(a);
        } catch (e) {
          setLocalInputValue("0");
        }
      }
      setUnit("usd");
    } else {
      if (localInputValue && token && convertedAmount) {
        try {
          const a = utils.formatUnits(convertedAmount, token.decimals);
          setLocalInputValue(a);
        } catch (e) {
          setLocalInputValue("0");
        }
      }
      setUnit("token");
    }
  }, [unit, localInputValue, token, convertedAmount, setUnit]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!isValidNumberInput(value)) {
        return;
      }

      setLocalInputValue(value);
      setJustTyped(true);

      if (!token) {
        setAmount(null);
        return;
      }

      try {
        const parsed = parseInputValue(value, token, unit);
        setAmount(parsed);
      } catch (e) {
        setAmount(null);
      }
    },
    [token, unit, setAmount]
  );

  const handleBalanceClick = useCallback(
    (amount: BigNumber, _decimals: number) => {
      setAmount(amount);
      if (token) {
        setLocalInputValue(formatAmountForDisplay(amount, token, unit));
      }
    },
    [setAmount, unit, token]
  );

  return {
    amountString,
    setAmountString,
    unit,
    convertedAmount,
    toggleUnit,
    handleInputChange,
    handleBalanceClick,
  };
}
