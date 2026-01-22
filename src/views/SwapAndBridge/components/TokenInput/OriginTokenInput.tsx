import { useEffect, useRef } from "react";
import SelectorButton from "../ChainTokenSelector/SelectorButton";
import { BalanceSelector } from "../BalanceSelector";
import {
  BalancePlaceholder,
  TokenAmountInputTitle,
  TokenAmountStack,
  TokenInputWrapper,
  TokenSelectorColumn,
} from "./styles";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { BigNumber } from "ethers";
import { hasInsufficientBalance } from "../../utils/balance";
import { useTokenBalance } from "views/SwapAndBridge/hooks/useTokenBalance";
import { ToggleUnitButton } from "./ToggleUnit/ToggleUnitButton";
import { AmountInput } from "./AmountInput";
import { UnitType } from "../../types";

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

  const displayAmount = shouldUpdate ? expectedAmount : quoteRequest.amount;

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>From</TokenAmountInputTitle>
        <AmountInput
          id="origin-amount-input"
          name="origin-amount-input"
          testId="bridge-amount-input"
          amount={displayAmount}
          token={originToken}
          unit={unit}
          shouldUpdate={shouldUpdate}
          disabled={inputDisabled}
          error={insufficientBalance}
          setAmount={setOriginAmount}
          inputRef={amountInputRef}
        />
        <ToggleUnitButton
          unit={unit}
          setUnit={setUnit}
          token={originToken}
          amount={displayAmount}
        />
      </TokenAmountStack>
      <TokenSelectorColumn>
        <SelectorButton
          onSelect={setOriginToken}
          onSelectOtherToken={setDestinationToken}
          isOriginToken={true}
          selectedToken={originToken}
          otherToken={destinationToken}
        />

        {originToken ? (
          <BalanceSelector
            token={originToken}
            disableHover={false}
            error={insufficientBalance}
            setAmount={setOriginAmount}
          />
        ) : (
          <BalancePlaceholder />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
