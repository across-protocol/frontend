import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatAmountForDisplay,
  formatUSD,
  isValidNumberInput,
  parseInputValue,
} from "utils";
import SelectorButton from "../ChainTokenSelector/SelectorButton";
import { BalanceSelector } from "../BalanceSelector";
import {
  TokenAmountInput,
  TokenAmountInputTitle,
  TokenAmountInputWrapper,
  TokenAmountStack,
  TokenInputWrapper,
  TokenSelectorColumn,
  UnitToggleButton,
  UnitToggleButtonWrapper,
} from "./styles";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { BigNumber } from "ethers";
import { hasInsufficientBalance } from "../../utils/balance";
import { useTokenBalance } from "views/SwapAndBridge/hooks/useTokenBalance";

export type UnitType = "usd" | "token";

type OriginTokenInputProps = {
  isUpdateLoading: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
};

export const OriginTokenInput = ({
  isUpdateLoading,
  unit,
  setUnit,
}: OriginTokenInputProps) => {
  const { quoteRequest, setUserInput, setOriginToken, setDestinationToken } =
    useQuoteRequestContext();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocusedRef = useRef(false);

  const [inputBuffer, setInputBuffer] = useState<string>("");
  const [isUserTyping, setIsUserTyping] = useState(false);

  const { originToken, destinationToken } = quoteRequest;

  const isUserInput = quoteRequest.userInputField === "origin";

  const handleSetInputValue = useCallback(
    (value: string) => {
      if (!originToken) {
        setUserInput("origin", null);
        return;
      }

      try {
        const parsed = parseInputValue(value, originToken, unit);
        setUserInput("origin", parsed);
      } catch (e) {
        setUserInput("origin", null);
      }
    },
    [setUserInput, originToken, unit]
  );

  const handleBalanceClick = useCallback(
    (amount: BigNumber) => {
      if (!originToken) return;

      setUserInput("origin", amount);
      setIsUserTyping(false);
      setInputBuffer("");
    },
    [originToken, setUserInput]
  );

  const displayValue = useMemo(() => {
    if (isUserTyping) {
      return inputBuffer;
    }

    if (!isUserInput && isUpdateLoading) {
      return "";
    }

    const amount = isUserInput
      ? quoteRequest.userInputAmount
      : quoteRequest.quoteOutputAmount;

    if (!amount || !originToken) {
      return "";
    }

    return formatAmountForDisplay(amount, originToken, unit);
  }, [
    isUserTyping,
    inputBuffer,
    isUserInput,
    isUpdateLoading,
    quoteRequest.userInputAmount,
    quoteRequest.quoteOutputAmount,
    originToken,
    unit,
  ]);

  const [convertedAmount, setConvertedAmount] = useState<BigNumber>();

  useEffect(() => {
    const amount = isUserInput
      ? quoteRequest.userInputAmount
      : quoteRequest.quoteOutputAmount;

    if (!originToken || !amount) {
      setConvertedAmount(undefined);
      return;
    }

    try {
      const formatted = formatAmountForDisplay(amount, originToken, unit);
      if (unit === "token") {
        const usdValue = convertTokenToUSD(formatted, originToken);
        setConvertedAmount(usdValue);
      } else {
        const tokenValue = convertUSDToToken(formatted, originToken);
        setConvertedAmount(tokenValue);
      }
    } catch (e) {
      setConvertedAmount(undefined);
    }
  }, [
    originToken,
    quoteRequest.userInputAmount,
    quoteRequest.quoteOutputAmount,
    unit,
    isUserInput,
  ]);

  const toggleUnit = useCallback(() => {
    if (!originToken || !convertedAmount) {
      setUnit(unit === "token" ? "usd" : "token");
      return;
    }

    const newUnit = unit === "token" ? "usd" : "token";
    setUnit(newUnit);

    if (isUserInput && quoteRequest.userInputAmount) {
      setUserInput("origin", convertedAmount);
    }

    setIsUserTyping(false);
    setInputBuffer("");
  }, [
    unit,
    originToken,
    convertedAmount,
    isUserInput,
    quoteRequest.userInputAmount,
    setUnit,
    setUserInput,
  ]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!isValidNumberInput(value)) {
        return;
      }

      setIsUserTyping(true);
      setInputBuffer(value);
      handleSetInputValue(value);
    },
    [handleSetInputValue]
  );

  const handleBlur = useCallback(() => {
    setIsUserTyping(false);
    setInputBuffer("");
  }, []);

  const inputDisabled = (() => {
    if (!quoteRequest.destinationToken) return true;
    return Boolean(!isUserInput && isUpdateLoading);
  })();

  const balance = useTokenBalance(quoteRequest?.originToken);

  const insufficientBalance = hasInsufficientBalance(quoteRequest, balance);

  useEffect(() => {
    if (
      !inputDisabled &&
      !hasAutoFocusedRef.current &&
      amountInputRef.current
    ) {
      amountInputRef.current.focus();
      hasAutoFocusedRef.current = true;
    }
  }, [inputDisabled]);

  const formattedConvertedAmount = useMemo(() => {
    if (unit === "token") {
      if (!convertedAmount) return "$0.00";
      return "$" + formatUSD(convertedAmount);
    }
    if (!convertedAmount) return "0.00";
    return `${formatUnits(convertedAmount, originToken?.decimals)} ${originToken?.symbol}`;
  }, [unit, convertedAmount, originToken]);

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>From</TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={displayValue}
          error={insufficientBalance}
        >
          <TokenAmountInput
            id="origin-amount-input"
            name="origin-amount-input"
            data-testid="bridge-amount-input"
            ref={amountInputRef}
            placeholder="0.00"
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            disabled={inputDisabled}
            error={insufficientBalance}
          />
        </TokenAmountInputWrapper>
        <UnitToggleButtonWrapper>
          <UnitToggleButton onClick={toggleUnit}>
            <ArrowsCross width={16} height={16} />{" "}
            <span>{formattedConvertedAmount}</span>
          </UnitToggleButton>
        </UnitToggleButtonWrapper>
      </TokenAmountStack>
      <TokenSelectorColumn>
        <SelectorButton
          onSelect={setOriginToken}
          onSelectOtherToken={setDestinationToken}
          isOriginToken={true}
          marginBottom={originToken ? "24px" : "0px"}
          selectedToken={originToken}
          otherToken={destinationToken}
        />

        {originToken && (
          <BalanceSelector
            token={originToken}
            disableHover={false}
            error={insufficientBalance}
            setAmount={(amount) => {
              if (amount) {
                handleBalanceClick(amount);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
