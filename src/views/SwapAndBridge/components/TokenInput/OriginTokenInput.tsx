import { useEffect, useRef } from "react";
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
} from "./styles";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { BigNumber } from "ethers";
import { hasInsufficientBalance } from "../../utils/balance";
import { useTokenBalance } from "views/SwapAndBridge/hooks/useTokenBalance";
import { ToggleUnitButton } from "./ToggleUnit/ToggleUnitButton";

type OriginTokenInputProps = {
  expectedAmount: BigNumber | undefined;
  isUpdateLoading: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
};

export const OriginTokenInput = ({
  expectedAmount,
  isUpdateLoading,
  unit,
  setUnit,
}: OriginTokenInputProps) => {
  const { quoteRequest, setOriginAmount, setOriginToken, setDestinationToken } =
    useQuoteRequestContext();
  const amountInputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocusedRef = useRef(false);

  const { originToken, destinationToken } = quoteRequest;

  const shouldUpdate = quoteRequest.tradeType === "minOutput";

  const {
    amountString,
    convertedAmount,
    toggleUnit,
    handleInputChange,
    handleBalanceClick,
  } = useTokenInput({
    token: originToken,
    setAmount: setOriginAmount,
    expectedAmount,
    shouldUpdate,
    isUpdateLoading,
    unit,
    setUnit,
  });

  const inputDisabled = (() => {
    if (!quoteRequest.destinationToken) return true;
    return Boolean(shouldUpdate && isUpdateLoading);
  })();

  const balance = useTokenBalance(quoteRequest?.originToken);

  const insufficientBalance = hasInsufficientBalance(
    quoteRequest,
    expectedAmount,
    balance
  );

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
        <ToggleUnitButton
          onClick={toggleUnit}
          unit={unit}
          token={originToken}
          convertedAmount={convertedAmount}
        />
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
                handleBalanceClick(amount, originToken.decimals);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
