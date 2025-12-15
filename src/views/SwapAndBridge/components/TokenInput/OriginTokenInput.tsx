import { useCallback, useEffect, useRef } from "react";
import { formatUnits } from "ethers/lib/utils";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { formatAmountForDisplay, formatUSD, parseInputValue } from "utils";
import { UnitType, useTokenInput } from "hooks";
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

  const { originToken, destinationToken } = quoteRequest;

  const isUserInput = quoteRequest.userInputField === "origin";

  const handleSetInputValue = useCallback(
    (value: string) => {
      if (!originToken) {
        setUserInput("origin", value, null);
        return;
      }

      try {
        const parsed = parseInputValue(value, originToken, unit);
        setUserInput("origin", value, parsed);
      } catch (e) {
        setUserInput("origin", value, null);
      }
    },
    [setUserInput, originToken, unit]
  );

  const handleBalanceClick = useCallback(
    (amount: BigNumber) => {
      if (!originToken) return;

      const formatted = formatAmountForDisplay(amount, originToken, unit);
      setUserInput("origin", formatted, amount);
    },
    [originToken, unit, setUserInput]
  );

  const { amountString, convertedAmount, toggleUnit, handleInputChange } =
    useTokenInput({
      token: originToken,
      inputValue: quoteRequest.userInputValue,
      setInputValue: handleSetInputValue,
      isUserInput,
      quoteOutputAmount: quoteRequest.quoteOutputAmount,
      isUpdateLoading,
      unit,
      setUnit,
    });

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

  const formattedConvertedAmount = (() => {
    if (unit === "token") {
      if (!convertedAmount) return "$0.00";
      return "$" + formatUSD(convertedAmount);
    }
    if (!convertedAmount) return "0.00";
    return `${formatUnits(convertedAmount, originToken?.decimals)} ${originToken?.symbol}`;
  })();

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>From</TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={amountString}
          error={insufficientBalance}
        >
          <TokenAmountInput
            id="origin-amount-input"
            name="origin-amount-input"
            data-testid="bridge-amount-input"
            ref={amountInputRef}
            placeholder="0.00"
            value={amountString}
            onChange={(e) => handleInputChange(e.target.value)}
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
