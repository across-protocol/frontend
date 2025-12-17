import { useCallback, useMemo, useState } from "react";
import { NumericFormat } from "react-number-format";
import { UnitType, useTokenInput } from "hooks";
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
} from "./styles";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { BigNumber, utils } from "ethers";
import { ToggleUnitButton } from "./ToggleUnit/ToggleUnitButton";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatUnitsWithMaxFractions,
} from "../../../../utils";

type DestinationTokenDisplayProps = {
  expectedOutputAmount: BigNumber | undefined;
  isUpdateLoading: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
};

export const DestinationTokenDisplay = ({
  expectedOutputAmount,
  isUpdateLoading,
  unit,
  setUnit,
}: DestinationTokenDisplayProps) => {
  const {
    quoteRequest,
    setDestinationAmount,
    setOriginToken,
    setDestinationToken,
  } = useQuoteRequestContext();

  const shouldUpdate = quoteRequest.tradeType === "exactInput";
  const [isFocused, setIsFocused] = useState(false);

  const { destinationToken, originToken } = quoteRequest;

  const { toggleUnit, handleInputChange, handleBalanceClick } = useTokenInput({
    token: destinationToken,
    setAmount: setDestinationAmount,
    unit,
    setUnit,
  });

  const inputDisabled = (() => {
    if (!quoteRequest.destinationToken) return true;
    return Boolean(shouldUpdate && isUpdateLoading);
  })();

  const getAmount = useCallback(() => {
    if (shouldUpdate) {
      return fromBignumberToString(
        unit,
        expectedOutputAmount,
        destinationToken
      );
    } else {
      return fromBignumberToString(unit, quoteRequest.amount, destinationToken);
    }
  }, [
    expectedOutputAmount,
    quoteRequest.amount,
    destinationToken,
    shouldUpdate,
    unit,
  ]);

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
    const amount = shouldUpdate ? expectedOutputAmount : quoteRequest.amount;
    if (!amount || !destinationToken) return undefined;
    const amountStr = formatUnitsWithMaxFractions(
      amount,
      destinationToken.decimals
    );
    if (unit === "token") {
      return convertTokenToUSD(amountStr, destinationToken);
    } else {
      return convertUSDToToken(amountStr, destinationToken);
    }
  }, [
    shouldUpdate,
    expectedOutputAmount,
    quoteRequest.amount,
    destinationToken,
    unit,
  ]);

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>
          To
          <ChangeAccountModal />
        </TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={getAmount()}
          error={false}
        >
          <NumericFormat
            customInput={TokenAmountInput}
            id="destination-amount-input"
            name="destination-amount-input"
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
            error={false}
          />
        </TokenAmountInputWrapper>
        <ToggleUnitButton
          onClick={toggleUnit}
          unit={unit}
          token={destinationToken}
          convertedAmount={convertedAmount}
        />
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
