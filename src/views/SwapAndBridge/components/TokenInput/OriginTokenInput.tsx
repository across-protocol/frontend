import { Dispatch, useEffect, useRef } from "react";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { formatUSD } from "utils";
import { UnitType, useTokenInput } from "hooks";
import SelectorButton from "../ChainTokenSelector/SelectorButton";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
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
import {
  QuoteRequest,
  QuoteRequestAction,
} from "../../hooks/useQuoteRequest/quoteRequestAction";

type OriginTokenInputProps = {
  dispatchQuoteRequestAction: Dispatch<QuoteRequestAction>;
  expectedAmount: string | undefined;
  isUpdateLoading: boolean;
  insufficientBalance: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
  quoteRequest: QuoteRequest;
};

export const OriginTokenInput = ({
  quoteRequest,
  dispatchQuoteRequestAction,
  expectedAmount,
  isUpdateLoading,
  insufficientBalance,
  unit,
  setUnit,
}: OriginTokenInputProps) => {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocusedRef = useRef(false);

  const { originToken, destinationToken } = quoteRequest;
  const setOriginAmount = (amount: BigNumber | null) =>
    dispatchQuoteRequestAction({
      type: "SET_ORIGIN_AMOUNT",
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

  const shouldUpdate = quoteRequest.tradeType === "minOutput";

  const {
    amountString,
    convertedAmount,
    toggleUnit,
    handleInputChange,
    handleBalanceClick,
  } = useTokenInput({
    token: originToken,
    setAmount: setOriginAmount,
    expectedAmount,
    shouldUpdate,
    isUpdateLoading,
    unit,
    setUnit,
  });

  const inputDisabled = (() => {
    if (!quoteRequest.destinationToken) return true;
    return Boolean(shouldUpdate && isUpdateLoading);
  })();

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

  const formattedConvertedAmount = (() => {
    if (unit === "token") {
      if (!convertedAmount) return "$0.00";
      return "$" + formatUSD(convertedAmount);
    }
    if (!convertedAmount) return "0.00";
    return `${formatUnits(convertedAmount, originToken?.decimals)} ${originToken?.symbol}`;
  })();

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>From</TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={amountString}
          error={insufficientBalance}
        >
          <TokenAmountInput
            id="origin-amount-input"
            name="origin-amount-input"
            data-testid="bridge-amount-input"
            ref={amountInputRef}
            placeholder="0.00"
            value={amountString}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={inputDisabled}
            error={insufficientBalance}
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
                handleBalanceClick(amount, originToken.decimals);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
