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
}: UseTokenInputProps): UseTokenInputReturn {
  const [amountString, setAmountString] = useState<string>("");
  const [unit, setUnit] = useState<UnitType>("token");
  const [convertedAmount, setConvertedAmount] = useState<BigNumber>();
  const [justTyped, setJustTyped] = useState(false);

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
      if (unit === "token") {
        const parsed = utils.parseUnits(amountString, token.decimals);
        setAmount(parsed);
      } else {
        const tokenValue = convertUSDToToken(amountString, token);
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

    if (expectedAmount && token && shouldUpdate) {
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
        setAmountString(utils.formatUnits(usdValue, token.decimals));
      }
    }
  }, [expectedAmount, isUpdateLoading, shouldUpdate, token, unit]);

  // Set converted value for display
  useEffect(() => {
    if (!token || !amountString) return;
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
      setConvertedAmount(undefined);
    }
  }, [token, amountString, unit]);

  // Toggle between token and USD units
  const toggleUnit = useCallback(() => {
    if (unit === "token") {
      // Convert token amount to USD string for display
      if (amountString && token && convertedAmount) {
        try {
          const a = utils.formatUnits(convertedAmount, token.decimals);
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
          const a = utils.formatUnits(convertedAmount, token.decimals);
          setAmountString(a);
        } catch (e) {
          setAmountString("0");
        } finally {
          setUnit("token");
        }
      }
    }
  }, [unit, amountString, token, convertedAmount]);

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
