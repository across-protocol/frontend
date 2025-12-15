import { useCallback } from "react";
import { formatUnits } from "ethers/lib/utils";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { formatAmountForDisplay, formatUSD, parseInputValue } from "utils";
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
  UnitToggleButton,
  UnitToggleButtonWrapper,
} from "./styles";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { BigNumber } from "ethers";

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

  const { destinationToken, originToken } = quoteRequest;

  const isUserInput = quoteRequest.userInputField === "destination";

  const handleSetInputValue = useCallback(
    (value: string) => {
      if (!destinationToken) {
        setUserInput("destination", value, null);
        return;
      }

      try {
        const parsed = parseInputValue(value, destinationToken, unit);
        setUserInput("destination", value, parsed);
      } catch (e) {
        setUserInput("destination", value, null);
      }
    },
    [setUserInput, destinationToken, unit]
  );

  const handleBalanceClick = useCallback(
    (amount: BigNumber) => {
      if (!destinationToken) return;

      const formatted = formatAmountForDisplay(amount, destinationToken, unit);
      setUserInput("destination", formatted, amount);
    },
    [destinationToken, unit, setUserInput]
  );

  const { amountString, convertedAmount, toggleUnit, handleInputChange } =
    useTokenInput({
      token: destinationToken,
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

  const formattedConvertedAmount = (() => {
    if (unit === "token") {
      if (!convertedAmount) return "$0.00";
      return "$" + formatUSD(convertedAmount);
    }
    if (!convertedAmount) return "0.00";
    return `${formatUnits(convertedAmount, destinationToken?.decimals)} ${destinationToken?.symbol}`;
  })();

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>
          To
          <ChangeAccountModal />
        </TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={amountString}
          error={false}
        >
          <TokenAmountInput
            id="destination-amount-input"
            name="destination-amount-input"
            placeholder="0.00"
            value={amountString}
            onChange={(e) => handleInputChange(e.target.value)}
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
