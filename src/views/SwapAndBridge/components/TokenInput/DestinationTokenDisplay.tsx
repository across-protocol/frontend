import { Dispatch } from "react";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { formatUSD } from "utils";
import { UnitType, useTokenInput } from "hooks";
import { ChangeAccountModal } from "views/Bridge/components/ChangeAccountModal";
import SelectorButton from "../ChainTokenSelector/SelectorButton";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
import { BalanceSelector } from "../BalanceSelector";
import {
  QuoteRequest,
  QuoteRequestAction,
} from "../../hooks/useQuoteRequest/quoteRequestAction";
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

type DestinationTokenDisplayProps = {
  expectedOutputAmount: string | undefined;
  isUpdateLoading: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
  quoteRequest: QuoteRequest;
  dispatchQuoteRequestAction: Dispatch<QuoteRequestAction>;
};

export const DestinationTokenDisplay = ({
  expectedOutputAmount,
  isUpdateLoading,
  unit,
  setUnit,
  quoteRequest,
  dispatchQuoteRequestAction,
}: DestinationTokenDisplayProps) => {
  const shouldUpdate = quoteRequest.tradeType === "exactInput";

  const { destinationToken, originToken } = quoteRequest;

  const setDestinationAmount = (amount: BigNumber | null) =>
    dispatchQuoteRequestAction({
      type: "SET_DESTINATION_AMOUNT",
      payload: amount,
    });

  const setOriginToken = (token: EnrichedToken | null) =>
    dispatchQuoteRequestAction({
      type: "SET_ORIGIN_TOKEN",
      payload: token,
    });

  const setDestinationToken = (token: EnrichedToken | null) => {
    dispatchQuoteRequestAction({
      type: "SET_DESTINATION_TOKEN",
      payload: token,
    });
  };

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
          <ChangeAccountModal
            quoteRequest={quoteRequest}
            dispatchQuoteRequestAction={dispatchQuoteRequestAction}
          />
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
                handleBalanceClick(amount, destinationToken.decimals);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
