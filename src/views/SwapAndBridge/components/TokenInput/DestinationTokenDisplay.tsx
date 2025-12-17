import { useMemo } from "react";
import { UnitType, useTokenInput } from "hooks";
import { ChangeAccountModal } from "../ChangeAccountModal";
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
import { ToggleUnitButton } from "./ToggleUnit/ToggleUnitButton";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatUnitsWithMaxFractions,
} from "../../../../utils";
import { AmountInput } from "./AmountInput";

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

  const displayAmount = shouldUpdate
    ? expectedOutputAmount
    : quoteRequest.amount;

  const convertedAmount = useMemo(() => {
    if (!displayAmount || !destinationToken) return undefined;
    const amountStr = formatUnitsWithMaxFractions(
      displayAmount,
      destinationToken.decimals
    );
    if (unit === "token") {
      return convertTokenToUSD(amountStr, destinationToken);
    } else {
      return convertUSDToToken(amountStr, destinationToken);
    }
  }, [displayAmount, destinationToken, unit]);

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
          onInputChange={handleInputChange}
        />
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
