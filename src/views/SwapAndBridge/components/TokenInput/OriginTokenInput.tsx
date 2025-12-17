import { useEffect, useMemo, useRef } from "react";
import { UnitType, useTokenInput } from "hooks";
import SelectorButton from "../ChainTokenSelector/SelectorButton";
import { BalanceSelector } from "../BalanceSelector";
import {
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
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatUnitsWithMaxFractions,
} from "../../../../utils";
import { AmountInput } from "./AmountInput";

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

  const { toggleUnit, handleInputChange, handleBalanceClick } = useTokenInput({
    token: originToken,
    setAmount: setOriginAmount,
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

  const displayAmount = shouldUpdate ? expectedAmount : quoteRequest.amount;

  const convertedAmount = useMemo(() => {
    if (!displayAmount || !originToken) return undefined;
    const amountStr = formatUnitsWithMaxFractions(
      displayAmount,
      originToken.decimals
    );
    if (unit === "token") {
      return convertTokenToUSD(amountStr, originToken);
    } else {
      return convertUSDToToken(amountStr, originToken);
    }
  }, [displayAmount, originToken, unit]);

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
          onInputChange={handleInputChange}
          inputRef={amountInputRef}
        />
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
                handleBalanceClick(amount);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
