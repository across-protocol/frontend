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
import { BigNumber } from "ethers";
import { ToggleUnitButton } from "./ToggleUnit/ToggleUnitButton";

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

  const { destinationToken, originToken } = quoteRequest;

  const {
    amountString,
    convertedAmount,
    toggleUnit,
    handleInputChange,
    handleBalanceClick,
  } = useTokenInput({
    token: destinationToken,
    setAmount: setDestinationAmount,
    expectedAmount: expectedOutputAmount,
    shouldUpdate,
    isUpdateLoading,
    unit,
    setUnit,
  });

  const inputDisabled = (() => {
    if (!quoteRequest.destinationToken) return true;
    return Boolean(shouldUpdate && isUpdateLoading);
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
                handleBalanceClick(amount, destinationToken.decimals);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
