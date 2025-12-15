import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { FormattedTokenInput } from "./FormattedTokenInput";
import { ChangeAccountModal } from "../ChangeAccountModal";
import SelectorButton from "../ChainTokenSelector/SelectorButton";
import { BalanceSelector } from "../BalanceSelector";
import {
  TokenAmountInputTitle,
  TokenAmountInputWrapper,
  TokenAmountStack,
  TokenInputWrapper,
  TokenSelectorColumn,
  UnitToggleButton,
  UnitToggleButtonWrapper,
} from "./styles";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { useTokenAmountInput } from "../../hooks";

export type UnitType = "usd" | "token";

type DestinationTokenDisplayProps = {
  isUpdateLoading: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
};

export const DestinationTokenInput = ({
  isUpdateLoading,
  unit,
  setUnit,
}: DestinationTokenDisplayProps) => {
  const { quoteRequest, setUserInput, setOriginToken, setDestinationToken } =
    useQuoteRequestContext();

  const { destinationToken, originToken } = quoteRequest;

  const {
    displayValue,
    formattedConvertedAmount,
    inputDisabled,
    handleInputChange,
    handleBalanceClick,
    toggleUnit,
  } = useTokenAmountInput({
    token: destinationToken,
    fieldName: "destination",
    unit,
    setUnit,
    isUpdateLoading,
    setUserInput,
    quoteRequest,
  });

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
          <FormattedTokenInput
            id="destination-amount-input"
            name="destination-amount-input"
            value={displayValue}
            onChange={handleInputChange}
            placeholder="0.00"
            disabled={inputDisabled}
            error={false}
            maxDecimals={18}
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
