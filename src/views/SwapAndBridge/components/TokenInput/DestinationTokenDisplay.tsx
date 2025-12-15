import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits } from "ethers/lib/utils";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatAmountForDisplay,
  formatUSD,
  isValidNumberInput,
  parseInputValue,
} from "utils";
import { ChangeAccountModal } from "../ChangeAccountModal";
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

export type UnitType = "usd" | "token";

type DestinationTokenDisplayProps = {
  isUpdateLoading: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
};

export const DestinationTokenDisplay = ({
  isUpdateLoading,
  unit,
  setUnit,
}: DestinationTokenDisplayProps) => {
  const { quoteRequest, setUserInput, setOriginToken, setDestinationToken } =
    useQuoteRequestContext();

  const [inputBuffer, setInputBuffer] = useState<string>("");
  const [isUserTyping, setIsUserTyping] = useState(false);

  const { destinationToken, originToken } = quoteRequest;

  const isUserInput = quoteRequest.userInputField === "destination";

  const handleSetInputValue = useCallback(
    (value: string) => {
      if (!destinationToken) {
        setUserInput("destination", null);
        return;
      }

      try {
        const parsed = parseInputValue(value, destinationToken, unit);
        setUserInput("destination", parsed);
      } catch (e) {
        setUserInput("destination", null);
      }
    },
    [setUserInput, destinationToken, unit]
  );

  const handleBalanceClick = useCallback(
    (amount: BigNumber) => {
      if (!destinationToken) return;

      setUserInput("destination", amount);
      setIsUserTyping(false);
      setInputBuffer("");
    },
    [destinationToken, setUserInput]
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

    if (!amount || !destinationToken) {
      return "";
    }

    return formatAmountForDisplay(amount, destinationToken, unit);
  }, [
    isUserTyping,
    inputBuffer,
    isUserInput,
    isUpdateLoading,
    quoteRequest.userInputAmount,
    quoteRequest.quoteOutputAmount,
    destinationToken,
    unit,
  ]);

  const [convertedAmount, setConvertedAmount] = useState<BigNumber>();

  useEffect(() => {
    const amount = isUserInput
      ? quoteRequest.userInputAmount
      : quoteRequest.quoteOutputAmount;

    if (!destinationToken || !amount) {
      setConvertedAmount(undefined);
      return;
    }

    try {
      const formatted = formatAmountForDisplay(amount, destinationToken, unit);
      if (unit === "token") {
        const usdValue = convertTokenToUSD(formatted, destinationToken);
        setConvertedAmount(usdValue);
      } else {
        const tokenValue = convertUSDToToken(formatted, destinationToken);
        setConvertedAmount(tokenValue);
      }
    } catch (e) {
      setConvertedAmount(undefined);
    }
  }, [
    destinationToken,
    quoteRequest.userInputAmount,
    quoteRequest.quoteOutputAmount,
    unit,
    isUserInput,
  ]);

  const toggleUnit = useCallback(() => {
    if (!destinationToken || !convertedAmount) {
      setUnit(unit === "token" ? "usd" : "token");
      return;
    }

    const newUnit = unit === "token" ? "usd" : "token";
    setUnit(newUnit);

    if (isUserInput && quoteRequest.userInputAmount) {
      setUserInput("destination", convertedAmount);
    }

    setIsUserTyping(false);
    setInputBuffer("");
  }, [
    unit,
    destinationToken,
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

  const formattedConvertedAmount = useMemo(() => {
    if (unit === "token") {
      if (!convertedAmount) return "$0.00";
      return "$" + formatUSD(convertedAmount);
    }
    if (!convertedAmount) return "0.00";
    return `${formatUnits(convertedAmount, destinationToken?.decimals)} ${destinationToken?.symbol}`;
  }, [unit, convertedAmount, destinationToken]);

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>
          To
          <ChangeAccountModal />
        </TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={displayValue}
          error={false}
        >
          <TokenAmountInput
            id="destination-amount-input"
            name="destination-amount-input"
            placeholder="0.00"
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            disabled={inputDisabled}
            error={false}
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
          onSelect={setDestinationToken}
          onSelectOtherToken={setOriginToken}
          isOriginToken={false}
          marginBottom={destinationToken ? "24px" : "0px"}
          selectedToken={destinationToken}
          otherToken={originToken}
        />

        {destinationToken && (
          <BalanceSelector
            token={destinationToken}
            disableHover={true}
            error={false}
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
