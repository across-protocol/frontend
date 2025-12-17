import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NumericFormat } from "react-number-format";
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
import { BigNumber, utils } from "ethers";
import { hasInsufficientBalance } from "../../utils/balance";
import { useTokenBalance } from "views/SwapAndBridge/hooks/useTokenBalance";
import { ToggleUnitButton } from "./ToggleUnit/ToggleUnitButton";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatUnitsWithMaxFractions,
} from "../../../../utils";

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
  const [isFocused, setIsFocused] = useState(false);

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

  const getAmount = useCallback(() => {
    if (shouldUpdate) {
      return fromBignumberToString(unit, expectedAmount, originToken);
    } else {
      return fromBignumberToString(unit, quoteRequest.amount, originToken);
    }
  }, [expectedAmount, quoteRequest.amount, originToken, shouldUpdate, unit]);

  function fromBignumberToString(
    unit: "usd" | "token",
    amount: BigNumber | null | undefined,
    token: EnrichedToken | null
  ) {
    if (!amount || !token) {
      return "";
    }
    if (unit === "token") {
      // Display as token amount
      return formatUnitsWithMaxFractions(amount, token.decimals);
    } else {
      // Display as USD amount - convert token to USD
      const tokenAmountFormatted = formatUnitsWithMaxFractions(
        amount,
        token.decimals
      );
      const usdValue = convertTokenToUSD(tokenAmountFormatted, token);
      // convertTokenToUSD returns in 18 decimal precision
      return utils.formatUnits(usdValue, 18);
    }
  }

  const convertedAmount = useMemo(() => {
    const amount = shouldUpdate ? expectedAmount : quoteRequest.amount;
    if (!amount || !originToken) return undefined;
    const amountStr = formatUnitsWithMaxFractions(amount, originToken.decimals);
    if (unit === "token") {
      return convertTokenToUSD(amountStr, originToken);
    } else {
      return convertUSDToToken(amountStr, originToken);
    }
  }, [shouldUpdate, expectedAmount, quoteRequest.amount, originToken, unit]);

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>From</TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={getAmount()}
          error={insufficientBalance}
        >
          <NumericFormat
            customInput={TokenAmountInput}
            getInputRef={amountInputRef}
            id="origin-amount-input"
            name="origin-amount-input"
            data-testid="bridge-amount-input"
            placeholder="0.00"
            value={isFocused && !shouldUpdate ? undefined : getAmount()}
            onValueChange={(values, sourceInfo) => {
              if (sourceInfo.source === "event" && isFocused) {
                handleInputChange(values.floatValue);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            thousandSeparator=","
            decimalSeparator="."
            allowNegative={false}
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
                handleBalanceClick(amount);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
