import { ChangeAccountModal } from "../ChangeAccountModal";
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
import { ToggleUnitButton } from "./ToggleUnit/ToggleUnitButton";
import { AmountInput } from "./AmountInput";
import { UnitType } from "../../types";

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

  const { destinationToken, originToken, customDestinationAccount } =
    quoteRequest;

  const inputDisabled = (() => {
    if (!quoteRequest.destinationToken) return true;
    return Boolean(shouldUpdate && isUpdateLoading);
  })();

  const displayAmount = shouldUpdate
    ? expectedOutputAmount
    : quoteRequest.amount;

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>
          To
          <ChangeAccountModal />
        </TokenAmountInputTitle>

        <AmountInput
          id="destination-amount-input"
          name="destination-amount-input"
          amount={displayAmount}
          token={destinationToken}
          unit={unit}
          shouldUpdate={shouldUpdate}
          disabled={inputDisabled}
          error={false}
          setAmount={setDestinationAmount}
        />
        <ToggleUnitButton
          setUnit={setUnit}
          unit={unit}
          token={destinationToken}
          amount={displayAmount}
        />
      </TokenAmountStack>
      <TokenSelectorColumn>
        <SelectorButton
          onSelect={setDestinationToken}
          onSelectOtherToken={setOriginToken}
          isOriginToken={false}
          selectedToken={destinationToken}
          otherToken={originToken}
        />

        {destinationToken && !customDestinationAccount ? (
          <BalanceSelector
            token={destinationToken}
            error={false}
            setAmount={setDestinationAmount}
          />
        ) : (
          <BalancePlaceholder />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
