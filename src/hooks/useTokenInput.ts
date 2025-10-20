import { useCallback, useEffect, useState } from "react";
import { BigNumber, utils } from "ethers";
import { convertTokenToUSD, convertUSDToToken } from "utils";
import { EnrichedToken } from "views/SwapAndBridge/components/ChainTokenSelector/Modal";
import { formatUnitsWithMaxFractions } from "utils";

export type UnitType = "usd" | "token";

type UseTokenInputProps = {
  token: EnrichedToken | null;
  setAmount: (amount: BigNumber | null) => void;
  expectedAmount: string | undefined;
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
  const [internalUnit, setInternalUnit] = useState<UnitType>("token");
  const [convertedAmount, setConvertedAmount] = useState<BigNumber>();
  const [justTyped, setJustTyped] = useState(false);

  // Use external unit if provided, otherwise use internal state
  const unit = externalUnit ?? internalUnit;
  const setUnit = externalSetUnit ?? setInternalUnit;

  // Handle user input changes - propagate to parent
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
      // If the input is empty or effectively zero, set amount to null
      if (!amountString || !Number(amountString)) {
        setAmount(null);
        return;
      }
      if (unit === "token") {
        const parsed = utils.parseUnits(amountString, token.decimals);
        // If parsed amount is zero or negative, set to null
        if (parsed.lte(0)) {
          setAmount(null);
          return;
        }
        setAmount(parsed);
      } else {
        const tokenValue = convertUSDToToken(amountString, token);
        // If converted value is zero or negative, set to null
        if (tokenValue.lte(0)) {
          setAmount(null);
          return;
        }
        setAmount(tokenValue);
      }
    } catch (e) {
      setAmount(null);
    }
  }, [amountString, justTyped, token, unit, setAmount]);

  // Reset amount when token changes
  useEffect(() => {
    if (token) {
      setAmountString("");
      setConvertedAmount(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.chainId, token?.symbol]);

  // Handle quote updates - only update the field that should receive the quote
  useEffect(() => {
    if (shouldUpdate && isUpdateLoading) {
      setAmountString("");
    }

    if (shouldUpdate && token) {
      // Clear the field when there's no expected amount and not loading
      if (!expectedAmount && !isUpdateLoading) {
        setAmountString("");
      } else {
        if (expectedAmount) {
          if (unit === "token") {
            // Display as token amount
            setAmountString(
              formatUnitsWithMaxFractions(expectedAmount, token.decimals)
            );
          } else {
            // Display as USD amount - convert token to USD
            const tokenAmountFormatted = formatUnitsWithMaxFractions(
              expectedAmount,
              token.decimals
            );
            const usdValue = convertTokenToUSD(tokenAmountFormatted, token);
            // convertTokenToUSD returns in 18 decimal precision
            setAmountString(utils.formatUnits(usdValue, 18));
          }
        }
      }
    }
  }, [expectedAmount, isUpdateLoading, shouldUpdate, token, unit]);

  // Set converted value for display
  useEffect(() => {
    if (!token || !amountString) {
      setConvertedAmount(undefined);
      return;
    }
    try {
      if (unit === "token") {
        // User typed token amount - convert to USD for display
        const usdValue = convertTokenToUSD(amountString, token);
        setConvertedAmount(usdValue);
      } else {
        // User typed USD amount - convert to token for display
        const tokenValue = convertUSDToToken(amountString, token);
        setConvertedAmount(tokenValue);
      }
    } catch (e) {
      // getting an underflow error here
      setConvertedAmount(undefined);
    }
  }, [token, amountString, unit]);

  // Toggle between token and USD units
  const toggleUnit = useCallback(() => {
    if (unit === "token") {
      // Convert token amount to USD string for display
      if (amountString && token && convertedAmount) {
        try {
          // convertedAmount is USD value in 18 decimals
          const a = utils.formatUnits(convertedAmount, 18);
          setAmountString(a);
        } catch (e) {
          setAmountString("0");
        } finally {
          setUnit("usd");
        }
      }
    } else {
      // Convert USD amount to token string for display
      if (amountString && token && convertedAmount) {
        try {
          // convertedAmount is token value in token's native decimals
          const a = utils.formatUnits(convertedAmount, token.decimals);
          setAmountString(a);
        } catch (e) {
          setAmountString("0");
        } finally {
          setUnit("token");
        }
      }
    }
  }, [unit, amountString, token, convertedAmount, setUnit]);

  // Handle input field changes
  const handleInputChange = useCallback((value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setJustTyped(true);
      setAmountString(value);
    }
  }, []);

  // Handle balance selector click
  const handleBalanceClick = useCallback(
    (amount: BigNumber, decimals: number) => {
      setAmount(amount);
      setAmountString(formatUnitsWithMaxFractions(amount, decimals));
    },
    [setAmount]
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
