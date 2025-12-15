import { useEffect, useRef } from "react";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
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
import { hasInsufficientBalance } from "../../utils/balance";
import { useTokenBalance } from "views/SwapAndBridge/hooks/useTokenBalance";
import { useTokenAmountInput } from "../../hooks";

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

  const { originToken, destinationToken } = quoteRequest;

  const {
    displayValue,
    formattedConvertedAmount,
    inputDisabled,
    handleInputChange,
    handleBalanceClick,
    toggleUnit,
  } = useTokenAmountInput({
    token: originToken,
    fieldName: "origin",
    unit,
    setUnit,
    isUpdateLoading,
    setUserInput,
    quoteRequest,
  });

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
